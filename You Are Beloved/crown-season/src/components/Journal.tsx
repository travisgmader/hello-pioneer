import { useJournal } from '../lib/storage';
import { getWeek, buildDays } from '../lib/curriculum';

/** "1-2" → "Week 1 · Day 2 — Go Deeper". */
function labelFor(key: string): string {
  const [w, d] = key.split('-').map(Number);
  const week = getWeek(w);
  const day = week ? buildDays(week)[d - 1] : undefined;
  return `Week ${w} · Day ${d}${day ? ` — ${day.title}` : ''}`;
}

/** Sort key so the most advanced study day sorts first. */
function order(key: string): number {
  const [w, d] = key.split('-').map(Number);
  return (w || 0) * 10 + (d || 0);
}

export default function Journal() {
  const { entries } = useJournal();

  const keys = Object.keys(entries)
    .filter((k) => entries[k].gratitude?.trim() || entries[k].reflection?.trim())
    .sort((a, b) => order(b) - order(a));

  return (
    <div>
      <div className="eyebrow">Daily Rhythm</div>
      <h1 className="h1">Journal</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Your gratitude and reflection for each day, private to your account.
      </p>

      <div className="section-gap" />
      {keys.length === 0 && (
        <div className="empty">
          Nothing here yet. Add a check-in on any day and it’ll appear here.
        </div>
      )}
      {keys.map((key) => {
        const e = entries[key];
        return (
          <div key={key} className="journal-entry">
            <div className="journal-date">{labelFor(key)}</div>
            {e.gratitude?.trim() && (
              <div className="journal-block">
                <div className="lbl">Grateful for</div>
                <div className="val">{e.gratitude}</div>
              </div>
            )}
            {e.reflection?.trim() && (
              <div className="journal-block">
                <div className="lbl">Reflection</div>
                <div className="val">{e.reflection}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
