package rootlevel.it.fastr.widget

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class FastWidgetModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "FastWidget"
    @ReactMethod
    fun update(startedAt: Double, endsAt: Double, promise: Promise) {
        if (!startedAt.isFinite() || !endsAt.isFinite() || startedAt < 0 ||
            (startedAt != 0.0 && endsAt <= startedAt)) {
            promise.reject("INVALID_FAST", "Invalid fasting timestamps"); return
        }
        try {
            FastWidgetProvider.save(reactApplicationContext, startedAt.toLong(), endsAt.toLong())
            promise.resolve(null)
        } catch (error: Exception) { promise.reject("WIDGET_UPDATE", error) }
    }
}
class FastWidgetPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(FastWidgetModule(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
