package rootlevel.it.fastr.widget

/** Pure wall-clock calculations, shared by every widget instance. */
object FastWidgetState {
    fun elapsed(startedAt: Long, now: Long): Long = (now - startedAt).coerceAtLeast(0)
    fun progress(startedAt: Long, endsAt: Long, now: Long): Int {
        if (startedAt <= 0 || endsAt <= startedAt) return 0
        return ((elapsed(startedAt, now).toDouble() / (endsAt - startedAt)) * 100).toInt().coerceIn(0, 100)
    }
    fun duration(milliseconds: Long): String {
        val minutes = milliseconds.coerceAtLeast(0) / 60000
        val hours = minutes / 60
        val remainder = minutes % 60
        return if (hours == 0L) "${remainder}m" else if (remainder == 0L) "${hours}h" else "${hours}h ${remainder}m"
    }
}
