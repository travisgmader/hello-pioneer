import { Link } from 'react-router-dom';
import { WEEKS, buildDays, dayKey } from '../lib/curriculum';
import { useProgress } from '../lib/storage';
import { isWeekUnlocked, formatUnlock } from '../lib/schedule';
import { LockIcon } from './Home';

export default function Weeks() {
  const { isDone } = useProgress();

  return (
    <div>
      <div className="eyebrow">Ten Weeks</div>
      <h1 className="h1">The Season</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        A new week opens each week. Locked weeks show when they unlock.
      </p>

      <div className="section-gap" />
      {WEEKS.map((w) => {
        const days = buildDays(w);
        const doneDays = days.filter((d) => isDone(dayKey(d.week, d.day))).length;
        const complete = doneDays === days.length;
        const unlocked = isWeekUnlocked(w.number);

        if (!unlocked) {
          return (
            <div key={w.number} className="week-row locked" aria-disabled="true">
              <div className="week-badge locked"><LockIcon size={18} /></div>
              <div className="week-row-body">
                <div className="week-row-title muted">{w.title}</div>
                <div className="week-row-sub">Opens {formatUnlock(w.number)}</div>
              </div>
              <div className="week-row-meta"><LockIcon /></div>
            </div>
          );
        }

        return (
          <Link key={w.number} to={`/week/${w.number}`} className={`week-row${complete ? ' done' : ''}`}>
            <div className="week-badge">{complete ? '✓' : w.number}</div>
            <div className="week-row-body">
              <div className="week-row-title">{w.title}</div>
              <div className="week-row-sub">{w.subtitle}</div>
              <div className="pips" aria-label={`${doneDays} of ${days.length} days done`}>
                {days.map((d) => (
                  <span key={d.day} className={`pip${isDone(dayKey(d.week, d.day)) ? ' on' : ''}`} />
                ))}
              </div>
            </div>
            <div className="week-row-meta">›</div>
          </Link>
        );
      })}
    </div>
  );
}
