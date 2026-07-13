import { Link } from 'react-router-dom';
import { memberTags, TAG_LABEL } from '../../lib/leader';
import { useLeader } from './LeaderData';

export default function MemberList() {
  const MEMBERS = useLeader().members;
  return (
    <div>
      <div className="eyebrow">Part 1</div>
      <h1 className="h1">The Men</h1>
      <p className="muted" style={{ marginTop: 0 }}>Tap a man for his full profile.</p>

      <div className="section-gap" />
      {MEMBERS.map((m) => {
        const tags = memberTags(m);
        return (
          <Link key={m.id} to={`/leader/member/${m.id}`} className="week-row">
            <div className="member-avatar">{m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
            <div className="week-row-body">
              <div className="week-row-title">
                {m.name} <span className="muted" style={{ fontWeight: 400 }}>· {m.age}</span>
              </div>
              <div className="week-row-sub">{m.mostUrgent || m.primaryDriver}</div>
              <div className="tag-row">
                {m.committed ? <span className="tag-in">In</span> : <span className="tag-deciding">Deciding</span>}
                {tags.slice(0, 3).map((t) => (
                  <span key={t} className="tag-chip">{TAG_LABEL[t]}</span>
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
