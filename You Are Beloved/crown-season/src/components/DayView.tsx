import { useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  getWeek,
  buildDays,
  dayKey,
  reflectionFor,
  TOTAL_WEEKS,
  type DayBlock,
  type StudyDay,
} from '../lib/curriculum';
import { useProgress } from '../lib/storage';
import { isDayUnlocked, isWeekUnlocked } from '../lib/schedule';
import DailyCheckin from './DailyCheckin';
import { LockIcon } from './Home';

function Scripture({ refName, text }: { refName: string | null; text: string }) {
  return (
    <div className="scripture">
      {refName && <span className="scripture-ref">{refName}</span>}
      <span className="scripture-text">{text}</span>
    </div>
  );
}

function BlockView({ block }: { block: DayBlock }) {
  switch (block.kind) {
    case 'teaching': {
      const t = block.teaching!;
      return (
        <div className="block">
          <p className="teaching-title">{t.title}</p>
          {t.scriptures.map((s, i) => (
            <Scripture key={i} refName={s.ref} text={s.text} />
          ))}
          <div className="block-body">
            {t.prose.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      );
    }
    case 'reading':
      return (
        <div className="block">
          <div className="block-label">{block.label}</div>
          {block.items!.map((r, i) => (
            <div key={i} className="reading-item">
              <span className="mark">📖</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      );
    case 'questions':
      return (
        <div className="block">
          <div className="block-label">{block.label}</div>
          <ol className="qlist">
            {block.items!.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </div>
      );
    case 'application':
      return (
        <div className="block app-challenge">
          <div className="block-label">{block.label}</div>
          <div className="block-body">
            {block.body!.split('\n').map((line, i) => (
              <p key={i} style={{ marginBottom: 8 }}>{line}</p>
            ))}
          </div>
        </div>
      );
    default:
      // bigIdea | tension | opening | reflection — plain labelled text
      return (
        <div className="block">
          {block.label && <div className="block-label">{block.label}</div>}
          <div className="block-body">
            <p style={{ margin: 0 }}>{block.body}</p>
          </div>
        </div>
      );
  }
}

export default function DayView() {
  const { n, d } = useParams();
  const navigate = useNavigate();
  const weekNum = Number(n);
  const dayNum = Number(d);
  const week = getWeek(weekNum);
  const { isDone, setDone } = useProgress();

  // Scroll to top when switching days.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [weekNum, dayNum]);

  if (!week || dayNum < 1 || dayNum > 3) return <Navigate to="/weeks" replace />;
  // Locks also guard direct URLs: bounce to the week overview (which explains
  // why it's locked) if this week hasn't released or the prior day isn't done.
  if (!isWeekUnlocked(weekNum) || !isDayUnlocked(weekNum, dayNum, isDone)) {
    return <Navigate to={`/week/${weekNum}`} replace />;
  }
  const days = buildDays(week);
  const day: StudyDay = days[dayNum - 1];
  const key = dayKey(weekNum, dayNum);
  const done = isDone(key);

  const isLastDayOfWeek = dayNum === 3;
  const isLastWeek = weekNum === TOTAL_WEEKS;

  function complete() {
    setDone(key, true);
    if (!isLastDayOfWeek) {
      navigate(`/week/${weekNum}/day/${dayNum + 1}`);
    } else if (!isLastWeek && isWeekUnlocked(weekNum + 1)) {
      navigate(`/week/${weekNum + 1}`);
    } else {
      navigate('/'); // next week not open yet → home shows "caught up"
    }
  }

  return (
    <div>
      <div className="eyebrow">Week {week.number} · {week.title}</div>
      <h1 className="h1">Day {day.day} — {day.title}</h1>
      <p className="lead" style={{ marginTop: 0 }}>{day.subtitle} · ~{day.estMinutes} min</p>

      {/* Day switcher — future days lock until the prior one is done */}
      <div className="daynav">
        {days.map((dd) => {
          const cls =
            'daynav-tab' +
            (dd.day === dayNum ? ' active' : '') +
            (isDone(dayKey(week.number, dd.day)) ? ' done' : '');
          if (!isDayUnlocked(week.number, dd.day, isDone)) {
            return (
              <span key={dd.day} className={cls + ' locked'} aria-disabled="true">
                <LockIcon size={12} /> Day {dd.day}
              </span>
            );
          }
          return (
            <Link key={dd.day} to={`/week/${week.number}/day/${dd.day}`} className={cls}>
              Day {dd.day}
            </Link>
          );
        })}
      </div>

      {/* Content blocks */}
      {day.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}

      <hr className="divider" />

      {/* Each study day has its own gratitude + reflection */}
      <DailyCheckin reflectionPrompt={reflectionFor(weekNum, dayNum)} entryKey={key} />

      <div className="section-gap" />
      <button className={`btn btn-block btn-lg ${done ? 'btn-outline' : 'btn-primary'}`} onClick={complete}>
        {done
          ? isLastDayOfWeek && isLastWeek
            ? 'Done ✓ — Back home'
            : isLastDayOfWeek
              ? 'Done ✓ — Next week →'
              : 'Done ✓ — Next day →'
          : isLastDayOfWeek
            ? 'Mark day complete — Ready for group →'
            : 'Mark day complete →'}
      </button>

      {done && (
        <button
          className="btn btn-outline btn-block"
          style={{ marginTop: 10 }}
          onClick={() => setDone(key, false)}
        >
          Mark as not done
        </button>
      )}
    </div>
  );
}
