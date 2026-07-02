const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "Nov 03" */
export function formatDateShort(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}

/** "12:34:56" */
export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** "93h 12m"; sub-hour durations render as bare minutes ("45m"). */
export function formatDurationShort(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) {
    return `${m}m`;
  }
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
