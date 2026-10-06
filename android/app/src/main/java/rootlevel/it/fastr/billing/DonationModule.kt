package rootlevel.it.fastr.billing

import android.util.Log
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClient.BillingResponseCode
import com.android.billingclient.api.BillingClient.ProductType
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ViewManager

/**
 * Donations as consumable Google Play in-app products. Every purchase is consumed right away,
 * so the same tip can be bought again and Play never auto-refunds it as unacknowledged.
 */
class DonationModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context), PurchasesUpdatedListener {
    private val client = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection()
        .build()
    private val products = mutableMapOf<String, Pair<ProductDetails, ProductDetails.OneTimePurchaseOfferDetails>>()
    private val waiting = mutableListOf<(BillingResult) -> Unit>()
    private var connecting = false
    private var purchasePromise: Promise? = null

    override fun getName() = "Donations"

    override fun invalidate() {
        client.endConnection()
        super.invalidate()
    }

    @ReactMethod
    fun getProducts(ids: ReadableArray, promise: Promise) = whenConnected(promise) {
        val list = ids.toArrayList().map {
            QueryProductDetailsParams.Product.newBuilder().setProductId(it as String).setProductType(ProductType.INAPP).build()
        }
        client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(list).build()) { result, response ->
            if (result.responseCode != BillingResponseCode.OK) {
                Log.w(TAG, "Product query failed: ${result.responseCode} ${result.debugMessage}")
                promise.reject("PRODUCTS_UNAVAILABLE", result.debugMessage); return@queryProductDetailsAsync
            }
            // Status codes: 2 = invalid id format, 3 = not found (wrong id, inactive, or not propagated yet), 4 = no eligible offer.
            response.unfetchedProductList.forEach { Log.w(TAG, "Not returned by Play: ${it.productId}, status ${it.statusCode}") }
            val out = Arguments.createArray()
            response.productDetailsList.forEach { details ->
                // Products made with Play Console's purchase options may only fill the offer list.
                val offer = details.oneTimePurchaseOfferDetails ?: details.oneTimePurchaseOfferDetailsList?.firstOrNull()
                    ?: run { Log.w(TAG, "No buy offer for ${details.productId}"); return@forEach }
                products[details.productId] = details to offer
                out.pushMap(Arguments.createMap().apply {
                    putString("id", details.productId)
                    putString("price", offer.formattedPrice)
                    putDouble("priceMicros", offer.priceAmountMicros.toDouble())
                })
            }
            promise.resolve(out)
        }
    }

    /** Resolves "purchased", "pending" (e.g. cash payment not completed yet) or "cancelled". */
    @ReactMethod
    fun purchase(productId: String, promise: Promise) = whenConnected(promise) {
        val (details, offer) = products[productId]
            ?: return@whenConnected promise.reject("UNKNOWN_PRODUCT", "Load products before purchasing")
        UiThreadUtil.runOnUiThread {
            val activity = reactApplicationContext.currentActivity
                ?: return@runOnUiThread promise.reject("NO_ACTIVITY", "App is not in the foreground")
            if (purchasePromise != null) return@runOnUiThread promise.reject("IN_PROGRESS", "A purchase is already running")
            purchasePromise = promise
            val params = BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details)
                    .apply { offer.offerToken?.let(::setOfferToken) }.build())).build()
            val result = client.launchBillingFlow(activity, params)
            if (result.responseCode != BillingResponseCode.OK) settle { it.reject("PURCHASE_FAILED", result.debugMessage) }
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        when (result.responseCode) {
            BillingResponseCode.OK -> {
                // Also fires later for pending purchases that completed, with nobody waiting on a promise.
                purchases.orEmpty().forEach(::consume)
                val purchased = purchases.orEmpty().any { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                settle { it.resolve(if (purchased) "purchased" else "pending") }
            }
            BillingResponseCode.USER_CANCELED -> settle { it.resolve("cancelled") }
            BillingResponseCode.ITEM_ALREADY_OWNED -> {
                // An earlier tip was never consumed (e.g. the app died mid-flow); clear it so a retry works.
                consumeLeftovers()
                settle { it.reject("ALREADY_OWNED", "Previous purchase is still being processed, try again") }
            }
            else -> settle { it.reject("PURCHASE_FAILED", result.debugMessage) }
        }
    }

    private fun settle(action: (Promise) -> Unit) {
        val promise = purchasePromise ?: return
        purchasePromise = null
        action(promise)
    }

    private fun consume(purchase: Purchase) {
        if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) return
        // Failures are retried by consumeLeftovers on the next connection.
        client.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(purchase.purchaseToken).build()) { _, _ -> }
    }

    private fun consumeLeftovers() {
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(ProductType.INAPP).build()) { result, purchases ->
            if (result.responseCode == BillingResponseCode.OK) purchases.forEach(::consume)
        }
    }

    /** Callers arriving while the first connection is still being set up queue up instead of reconnecting. */
    private fun whenConnected(promise: Promise, block: () -> Unit) {
        if (client.isReady) return block()
        synchronized(waiting) {
            waiting.add { result ->
                if (result.responseCode == BillingResponseCode.OK) block()
                else promise.reject("BILLING_UNAVAILABLE", result.debugMessage)
            }
            if (connecting) return
            connecting = true
        }
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                val callbacks = synchronized(waiting) { connecting = false; waiting.toList().also { waiting.clear() } }
                if (result.responseCode == BillingResponseCode.OK) consumeLeftovers()
                else Log.w(TAG, "Billing setup failed: ${result.responseCode} ${result.debugMessage}")
                callbacks.forEach { it(result) }
            }
            // enableAutoServiceReconnection re-establishes the connection on the next call.
            override fun onBillingServiceDisconnected() {}
        })
    }
}

private const val TAG = "Donations"

class DonationPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(DonationModule(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
