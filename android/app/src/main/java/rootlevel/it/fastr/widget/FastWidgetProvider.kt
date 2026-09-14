package rootlevel.it.fastr.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.SystemClock
import android.text.format.DateFormat
import android.text.format.DateUtils
import android.view.View
import android.widget.RemoteViews
import rootlevel.it.fastr.MainActivity
import rootlevel.it.fastr.R
import java.util.Date

class FastWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        ids.forEach { manager.updateAppWidget(it, views(context)) }
    }
    override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) {
        manager.updateAppWidget(id, views(context))
    }
    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_MY_PACKAGE_REPLACED -> updateAll(context)
        }
    }
    companion object {
        private const val PREFS = "fast_widget"

        fun save(context: Context, startedAt: Long, endsAt: Long) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putLong("startedAt", startedAt).putLong("endsAt", endsAt).commit()
            updateAll(context)
        }
        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, FastWidgetProvider::class.java))
            if (ids.isNotEmpty()) manager.updateAppWidget(ids, views(context))
        }
        private fun views(context: Context): RemoteViews {
            val data = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val start = data.getLong("startedAt", 0)
            val end = data.getLong("endsAt", 0)
            val running = start > 0 && end > start
            val now = System.currentTimeMillis()
            val views = RemoteViews(context.packageName, R.layout.fast_widget)
            val open = PendingIntent.getActivity(context, 0,
                Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.widget_root, open)
            val shown = { visible: Boolean -> if (visible) View.VISIBLE else View.GONE }
            views.setViewVisibility(R.id.widget_timer, shown(running))
            views.setViewVisibility(R.id.widget_progress, shown(running))
            views.setViewVisibility(R.id.widget_details, shown(running))
            views.setViewVisibility(R.id.widget_idle, shown(!running))
            views.setViewVisibility(R.id.widget_hint, shown(!running))
            if (running) {
                val percent = FastWidgetState.progress(start, end, now)
                // The launcher owns the ticking Chronometer; no JS process or service is needed.
                views.setChronometer(R.id.widget_timer,
                    SystemClock.elapsedRealtime() - FastWidgetState.elapsed(start, now), null, true)
                views.setProgressBar(R.id.widget_progress, 100, percent, false)
                views.setTextViewText(R.id.widget_target, context.getString(R.string.widget_target,
                    percent, FastWidgetState.duration(end - start)))
                // One row has little room: just the time today, weekday + time otherwise.
                val time = DateFormat.getTimeFormat(context).format(Date(end))
                val finish = if (DateUtils.isToday(end)) time else "${DateFormat.format("EEE", end)} $time"
                views.setTextViewText(R.id.widget_finish, if (now >= end) context.getString(R.string.widget_reached)
                    else context.getString(R.string.widget_finish, finish))
            } else {
                views.setChronometer(R.id.widget_timer, SystemClock.elapsedRealtime(), null, false)
            }
            return views
        }
    }
}
