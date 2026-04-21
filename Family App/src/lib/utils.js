export function formatTimeRange(start, end) {
  if (!start) return '';
  return end ? `${start} – ${end}` : start;
}
