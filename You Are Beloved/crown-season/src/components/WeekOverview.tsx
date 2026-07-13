import { Link, useParams, Navigate } from 'react-router-dom';
import { getWeek, buildDays, dayKey } from '../lib/curriculum';
import { useProgress } from '../lib/storage';
import { isWeekUnlocked, isDayUnlocked, formatUnlock } from '../lib/schedule';
import { LockIcon } from './Home';

export default function WeekOverview() {
  const { n } = useParams();
  const week = getWeek(Number(n));
  const { isDone } = useProgress();

  if (!week) return <Navigate to="/weeks" replace />;

  // A member can't open a week before it releases.
  if (!isWeekUnlocked(week.number)) {
    return (
      <div>
        <div className="eyebrow">Week {week.number}</div>
        <h1 className="h1">{week.title}</h1>
        <div className="locked-card">
          <div className="locked-emblem"><LockIcon size={30} /></div>
          <p className="h2" style={{ margin: '10px 0 4px' }}>Opens {formatUnlock(week.number)}</p>
          <p className="muted" style={{ margin: 0 }}>This week unlocks with the group. Stay with today’s week.</p>
          <Link to="/weeks" className="btn btn-outline btn-block" style={{ marginTop: 18 }}>Back to weeks</Link>
        </div>
      </div>
    );
  }

  const days = buildDays(week);

  return (
    <div>
      <div className="eyebrow">Week {week.number}</div>
      <h1 className="h1">{week.title}</h1>
      <p className="lead" style={{ marginTop: 0 }}>{week.subtitle}</p>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="block-label">The Big Idea</div>
        <p className="block-body" style={{ margin: 0 }}>{week.bigIdea}</p>
      </div>

      {week.reading.length > 0 && (
        <div className="card">
          <div className="block-label">Reading This Week</div>
          {week.reading.map((r, i) => (
            <div key={i} className="reading-item">
              <span className="mark">📖</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="h2 section-gap">Your three days</h2>
      {days.map((d) => {
        const done = isDone(dayKey(d.week, d.day));
        const open = isDayUnlocked(d.week, d.day, isDone);

        if (!open) {
          return (
            <div key={d.day} className="week-row locked" aria-disabled="true">
              <div className="week-badge locked"><LockIcon size={16} /></div>
              <div className="week-row-body">
                <div className="week-row-title muted">Day {d.day} · {d.title}</div>
                <div className="week-row-sub">Finish Day {d.day - 1} to unlock</div>
              </div>
              <div className="week-row-meta"><LockIcon /></div>
            </div>
          );
        }

        return (
          <Link key={d.day} to={`/week/${week.number}/day/${d.day}`} className={`week-row${done ? ' done' : ''}`}>
            <div className="week-badge">{done ? '✓' : `D${d.day}`}</div>
            <div className="week-row-body">
              <div className="week-row-title">Day {d.day} · {d.title}</div>
              <div className="week-row-sub">{d.subtitle}</div>
              <div className="week-row-meta">~{d.estMinutes} min{done ? ' · done' : ''}</div>
            </div>
            <div className="week-row-meta">›</div>
          </Link>
        );
      })}
    </div>
  );
}
