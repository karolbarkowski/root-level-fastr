package rootlevel.it.fastr.widget

/** Pure wall-clock calculations, shared by every widget instance. */
object FastWidgetState {
    fun elapsed(startedAt: Long, now: Long): Long = (now - startedAt).coerceAtLeast(0)
    fun progress(startedAt: Long, endsAt: Long, now: Long): Int = fraction(startedAt, endsAt, now, 100)
    /** Finer than [progress] so the bar visibly creeps forward between whole percents. */
    fun progressPermille(startedAt: Long, endsAt: Long, now: Long): Int = fraction(startedAt, endsAt, now, 1000)
    private fun fraction(startedAt: Long, endsAt: Long, now: Long, scale: Int): Int {
        if (startedAt <= 0 || endsAt <= startedAt) return 0
        return ((elapsed(startedAt, now).toDouble() / (endsAt - startedAt)) * scale).toInt().coerceIn(0, scale)
    }
    /** Every [REFRESH_MS] while running, landing exactly on the target; null once it has passed. */
    fun nextRefresh(startedAt: Long, endsAt: Long, now: Long): Long? {
        if (startedAt <= 0 || endsAt <= startedAt || now >= endsAt) return null
        return (now + REFRESH_MS).coerceAtMost(endsAt)
    }
    const val REFRESH_MS = 30_000L
    fun duration(milliseconds: Long): String {
        val minutes = milliseconds.coerceAtLeast(0) / 60000
        val hours = minutes / 60
        val remainder = minutes % 60
        return if (hours == 0L) "${remainder}m" else if (remainder == 0L) "${hours}h" else "${hours}h ${remainder}m"
    }
}
