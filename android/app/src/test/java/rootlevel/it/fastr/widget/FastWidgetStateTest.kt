package rootlevel.it.fastr.widget

import org.junit.Assert.assertEquals
import org.junit.Test

class FastWidgetStateTest {
    @Test fun progressClampsBeforeAndAfterFast() {
        assertEquals(0, FastWidgetState.progress(1000, 3000, 500))
        assertEquals(50, FastWidgetState.progress(1000, 3000, 2000))
        assertEquals(100, FastWidgetState.progress(1000, 3000, 3000))
        assertEquals(100, FastWidgetState.progress(1000, 3000, 5000))
    }
    @Test fun invalidAndIdleStateCannotDivideByZero() {
        assertEquals(0, FastWidgetState.progress(0, 0, 1000))
        assertEquals(0, FastWidgetState.progress(1000, 1000, 2000))
        assertEquals(0, FastWidgetState.progress(2000, 1000, 3000))
    }
    @Test fun elapsedContinuesAfterTargetAndHandlesClockRollback() {
        assertEquals(0L, FastWidgetState.elapsed(3000, 2000))
        assertEquals(5000L, FastWidgetState.elapsed(1000, 6000))
    }
    @Test fun fractionalAndLongTargetsKeepReadableDurations() {
        assertEquals("45m", FastWidgetState.duration(45 * 60000L))
        assertEquals("16h", FastWidgetState.duration(16 * 3600000L))
        assertEquals("16h 30m", FastWidgetState.duration(990 * 60000L))
        assertEquals("168h", FastWidgetState.duration(168 * 3600000L))
    }
}
