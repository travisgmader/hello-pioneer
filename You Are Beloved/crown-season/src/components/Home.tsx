import { Link } from 'react-router-dom';
import { allDays, dayKey, reflectionFor, getWeek, memoryVerseFor, TOTAL_WEEKS } from '../lib/curriculum';
import { useProgress } from '../lib/storage';
import { currentWeek, firstOpenIncompleteDay, formatUnlock } from '../lib/schedule';
import DailyCheckin from './DailyCheckin';

export default function Home() {
  const { isDone } = useProgress();
  const days = allDays();

  const doneCount = days.filter((d) => isDone(dayKey(d.week, d.day))).length;
  const total = days.length;
  const pct = Math.round((doneCount / total) * 100);
  const finished = doneCount === total;

  const cur = currentWeek(); // 0 before the season starts
  const target = firstOpenIncompleteDay(isDone); // next open, unfinished day
  const nextToOpen = cur < TOTAL_WEEKS ? cur + 1 : null;

  // The study day we anchor the check-in + memory verse to.
  const anchorWeek = target?.week ?? (cur >= 1 ? cur : 0);
  const anchorDay = target?.day ?? 1;
  const prompt = reflectionFor(anchorWeek || 1, anchorDay);
  const checkinKey = dayKey(anchorWeek || 1, anchorDay);
  const verse = anchorWeek >= 1 ? memoryVerseFor(anchorWeek) : undefined;

  return (
    <div>
      {/* ---- HERO: one of four states ---- */}
      {cur === 0 ? (
        <section className="hero">
          <div className="eyebrow">The season begins</div>
          <h1 className="h1">{formatUnlock(1)}</h1>
          <p className="lead">
            Week 1 — {getWeek(1)?.title} — opens {formatUnlock(1)}. The weeks unlock one at a time so
            we walk it together.
          </p>
          <div className="locked-banner" style={{ marginTop: 16 }}>
            <LockIcon /> Locked until {formatUnlock(1)}
          </div>
        </section>
      ) : target ? (
        <section className="hero">
          <div className="eyebrow">Continue</div>
          <h1 className="h1">Week {target.week} · Day {target.day}</h1>
          <p className="lead">{getWeek(target.week)?.title} — {target.title}</p>

          <div style={{ margin: '16px 0 10px' }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <span className="week-row-meta">{doneCount} of {total} days</span>
              <span className="week-row-meta">{pct}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <Link
            to={`/week/${target.week}/day/${target.day}`}
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: 14 }}
          >
            Start Day {target.day} →
          </Link>
        </section>
      ) : finished ? (
        <section className="hero">
          <div className="eyebrow">You finished the season</div>
          <h1 className="h1">Well done, brother.</h1>
          <p className="lead">You’ve walked all ten weeks. Revisit any week below, or keep the daily rhythm going.</p>
        </section>
      ) : (
        // Caught up: everything open is done, next week still locked.
        <section className="hero">
          <div className="eyebrow">Caught up</div>
          <h1 className="h1">You’re current, brother.</h1>
          <p className="lead">
            You’ve finished everything open so far.
            {nextToOpen && <> Week {nextToOpen} opens {formatUnlock(nextToOpen)}.</>}
          </p>
          {nextToOpen && (
            <div className="locked-banner" style={{ marginTop: 16 }}>
              <LockIcon /> Week {nextToOpen} opens {formatUnlock(nextToOpen)}
            </div>
          )}
        </section>
      )}

      {verse && (
        <>
          <div className="section-gap" />
          <div className="card">
            <div className="eyebrow">Memory verse · Week {anchorWeek}</div>
            <div className="scripture" style={{ marginBottom: 0 }}>
              <span className="scripture-ref">{verse.ref}</span>
              <span className="scripture-text">{verse.text}</span>
            </div>
          </div>
        </>
      )}

      <div className="section-gap" />
      <DailyCheckin reflectionPrompt={prompt} entryKey={checkinKey} />

      <div className="section-gap" />
      <div className="row-between">
        <h2 className="h2" style={{ margin: 0 }}>The rhythm</h2>
        <Link to="/weeks" className="pill">All weeks →</Link>
      </div>
      <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
        Each week is split into three short days — about 10–15 minutes each — so you can walk into
        group ready without carrying a book.
      </p>
    </div>
  );
}

export function LockIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px' }}>
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 018 0v3.5" />
    </svg>
  );
}
