import { Navigate, useParams, Link } from 'react-router-dom';
import { getMember, memberTags, TAG_LABEL, WEEK_TAGS } from '../../lib/leader';
import { useLeader } from './LeaderData';
import { getWeek } from '../../lib/curriculum';

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="pf-field">
      <div className="pf-label">{label}</div>
      <div className="pf-value">{value}</div>
    </div>
  );
}

export default function MemberProfile() {
  const { id } = useParams();
  const data = useLeader();
  const m = getMember(data, Number(id));
  if (!m) return <Navigate to="/leader/members" replace />;

  const tags = memberTags(m);
  // Weeks that most directly serve this man.
  const weeks = Object.entries(WEEK_TAGS)
    .filter(([, wt]) => wt.some((t) => tags.includes(t)))
    .map(([n]) => Number(n));

  return (
    <div>
      <div className="pf-head">
        <div className="member-avatar lg">{m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
        <div>
          <h1 className="h1" style={{ margin: 0 }}>{m.name}</h1>
          <div className="muted">Age {m.age} · {m.committed ? 'Committed' : 'Deciding'}</div>
          <div className="tag-row" style={{ marginTop: 8 }}>
            {tags.map((t) => <span key={t} className="tag-chip">{TAG_LABEL[t]}</span>)}
          </div>
        </div>
      </div>

      {m.inWords && (
        <div className="card callout">
          <div className="block-label">In His Words</div>
          <p className="in-words" style={{ margin: 0 }}>“{m.inWords.replace(/^["“]|["”]$/g, '')}”</p>
        </div>
      )}

      <div className="card">
        <div className="pf-grid">
          <Field label="Church / faith" value={m.church} />
          <Field label="Life stage" value={m.lifeStage} />
          <Field label="Primary driver" value={m.primaryDriver} />
          <Field label="Spiritual state" value={m.spiritualState} />
          <Field label="Most urgent" value={m.mostUrgent} />
          <Field label="Focus areas" value={m.focusAreas.join(' · ')} />
          <Field label="Heard via" value={m.heardVia} />
          <Field label="Prior group" value={m.priorGroup} />
        </div>
      </div>

      {m.read && (
        <div className="card">
          <div className="block-label">Read On Him</div>
          <p className="block-body" style={{ margin: 0 }}>{m.read}</p>
        </div>
      )}
      {m.lead && (
        <div className="card accent-card">
          <div className="block-label">Lead Him By</div>
          <p className="block-body" style={{ margin: 0 }}>{m.lead}</p>
        </div>
      )}
      {m.watch && (
        <div className="card warn-card">
          <div className="block-label">Watch</div>
          <p className="block-body" style={{ margin: 0 }}>{m.watch}</p>
        </div>
      )}

      {weeks.length > 0 && (
        <div className="card">
          <div className="block-label">Weeks That Serve Him Most</div>
          <div className="tag-row" style={{ marginTop: 2 }}>
            {weeks.map((n) => {
              const w = getWeek(n);
              return (
                <Link key={n} to={`/leader/week/${n}`} className="tag-chip link">
                  Wk {n}{w ? ` · ${w.title}` : ''}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
