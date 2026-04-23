export function formatTimeRange(start, end) {
  if (!start) return '';
  return end ? `${start} – ${end}` : start;
}

// Returns today's date as "YYYY-MM-DD" in LOCAL time (not UTC)
export function localToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Formats any Date object as "YYYY-MM-DD" in LOCAL time
export function localDateStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
