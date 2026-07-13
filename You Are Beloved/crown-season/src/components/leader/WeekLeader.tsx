import { Link, Navigate, useParams } from 'react-router-dom';
import { getWeek, curriculum } from '../../lib/curriculum';
import { leaderNotesForWeek, membersForWeek, WEEK_TAGS, TAG_LABEL } from '../../lib/leader';
import { useLeader } from './LeaderData';

export default function WeekLeader() {
  const { n } = useParams();
  const data = useLeader();
  const week = getWeek(Number(n));
  if (!week) return <Navigate to="/leader/weeks" replace />;

  const notes = leaderNotesForWeek(data, week.number);
  const watch = membersForWeek(data, week.number);
  const tags = WEEK_TAGS[week.number] ?? [];

  return (
    <div>
      <div className="eyebrow">Week {week.number} · Leader Prep</div>
      <h1 className="h1">{week.title}</h1>
      <p className="lead" style={{ marginTop: 0 }}>{week.subtitle}</p>
      <div className="tag-row">
        {tags.map((t) => <span key={t} className="tag-chip">{TAG_LABEL[t]}</span>)}
      </div>

      {/* Activations: who this week is for */}
      <h2 className="h2 section-gap">Who to Watch This Week</h2>
      {watch.length === 0 && <p className="muted">No one flagged specifically — lead the room as a whole.</p>}
      {watch.map(({ member, tags: overlap }) => (
        <div key={member.id} className="card watch-card">
          <div className="row-between">
            <Link to={`/leader/member/${member.id}`} className="watch-name">{member.name}</Link>
            <span className="muted" style={{ fontSize: 13 }}>{member.age}</span>
          </div>
          <div className="tag-row" style={{ margin: '6px 0 8px' }}>
            {overlap.map((t) => <span key={t} className="tag-chip sm">{TAG_LABEL[t]}</span>)}
          </div>
          {member.lead && <p className="block-body" style={{ margin: 0, fontSize: 14.5 }}>{member.lead}</p>}
        </div>
      ))}

      {/* Leader notes for the session */}
      {notes.length > 0 && (
        <>
          <h2 className="h2 section-gap">Leader Notes</h2>
          <div className="card">
            <ul className="tick-list">
              {notes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </div>
        </>
      )}

      {/* Opening exercise */}
      {week.opening && (
        <div className="card accent-card">
          <div className="block-label">Open With (Leader-Led)</div>
          <p className="block-body" style={{ margin: 0 }}>{week.opening}</p>
        </div>
      )}

      {/* Accountability questions reminder */}
      <div className="card">
        <div className="block-label">Every Session Opens With</div>
        <ol className="qlist">
          {curriculum.accountabilityQuestions.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
      </div>

      <Link to={`/week/${week.number}`} className="btn btn-outline btn-block section-gap">
        View the members’ week →
      </Link>
    </div>
  );
}
