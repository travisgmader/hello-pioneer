import { Link } from 'react-router-dom';
import { WEEKS } from '../../lib/curriculum';
import { WEEK_TAGS, TAG_LABEL, membersForWeek } from '../../lib/leader';
import { useLeader } from './LeaderData';

export default function WeekLeaderList() {
  const data = useLeader();
  return (
    <div>
      <div className="eyebrow">Week by Week</div>
      <h1 className="h1">Leader Prep</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Each week: your notes, who to watch, and how it lands for these men.
      </p>

      <div className="section-gap" />
      {WEEKS.map((w) => {
        const tags = WEEK_TAGS[w.number] ?? [];
        const watch = membersForWeek(data, w.number);
        return (
          <Link key={w.number} to={`/leader/week/${w.number}`} className="week-row">
            <div className="week-badge">{w.number}</div>
            <div className="week-row-body">
              <div className="week-row-title">{w.title}</div>
              <div className="tag-row">
                {tags.map((t) => <span key={t} className="tag-chip">{TAG_LABEL[t]}</span>)}
              </div>
              <div className="week-row-meta">{watch.length} men to watch this week</div>
            </div>
            <div className="week-row-meta">›</div>
          </Link>
        );
      })}
    </div>
  );
}
