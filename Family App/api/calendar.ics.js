const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const MEMBER_NAMES = {
  mom: 'Mom', dad: 'Dad', stella: 'Stella', roman: 'Roman', layla: 'Layla',
};

function fmtDt(dateStr, timeStr) {
  if (!timeStr) return dateStr.replace(/-/g, '');

  // Parse 12-hour time like "3:45 PM"
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return dateStr.replace(/-/g, '');
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const hh = String(h).padStart(2, '0');
  return `${dateStr.replace(/-/g, '')}T${hh}${min}00`;
}

function fmtEndDt(dateStr, timeStr, endTimeStr) {
  if (endTimeStr) return fmtDt(dateStr, endTimeStr);
  if (!timeStr) {
    // All-day: end is next day
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  }
  // Default 1-hour duration
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return fmtDt(dateStr, timeStr);
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  h = (h + 1) % 24;
  const hh = String(h).padStart(2, '0');
  return `${dateStr.replace(/-/g, '')}T${hh}${min}00`;
}

function escIcal(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function foldLine(line) {
  // iCal lines must be <= 75 octets; fold longer lines
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const parts = [];
  let offset = 0;
  let first = true;
  while (offset < bytes.length) {
    const chunk = first ? 75 : 74;
    parts.push((first ? '' : ' ') + bytes.slice(offset, offset + chunk).toString('utf8'));
    offset += chunk;
    first = false;
  }
  return parts.join('\r\n');
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.status(500).send('Supabase not configured');
    return;
  }

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/events?select=*&order=date`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!resp.ok) {
    res.status(502).send('Failed to fetch events');
    return;
  }

  const events = await resp.json();

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const vevents = events.map(e => {
    const dtstart = fmtDt(e.date, e.time);
    const dtend = fmtEndDt(e.date, e.time, e.end_time);
    const isAllDay = !e.time;
    const who = MEMBER_NAMES[e.member_id] || 'Family';
    const summary = escIcal(e.title);
    const desc = escIcal(who);

    const lines = [
      'BEGIN:VEVENT',
      `UID:${e.id}@family-plan`,
      `DTSTAMP:${now}`,
      isAllDay ? `DTSTART;VALUE=DATE:${dtstart}` : `DTSTART:${dtstart}`,
      isAllDay ? `DTEND;VALUE=DATE:${dtend}` : `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      'END:VEVENT',
    ];

    return lines.map(foldLine).join('\r\n');
  });

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Family Plan//Family Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Family Plan',
    'X-WR-TIMEZONE:America/Chicago',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="family-plan.ics"');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(cal);
}
