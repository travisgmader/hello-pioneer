import { Link } from 'react-router-dom';
import { decidingMembers } from '../../lib/leader';
import { useLeader } from './LeaderData';

export default function LeaderHome() {
  const data = useLeader();
  const { analysis, roster } = data;
  const MEMBERS = data.members;
  const total = MEMBERS.length;
  const inCount = MEMBERS.filter((m) => m.committed).length;
  const deciding = decidingMembers(data);
  const ages = MEMBERS.map((m) => m.age);
  const maxTopic = Math.max(...analysis.hotTopics.map((h) => h.count), 1);

  return (
    <div>
      <div className="eyebrow">The Crown Season</div>
      <h1 className="h1">Leadership Dashboard</h1>
      <p className="muted" style={{ marginTop: 0 }}>Your group at a glance — {total} men, Cheyenne.</p>

      {/* Pulse stats */}
      <div className="stat-grid">
        <div className="stat"><div className="stat-num">{inCount}</div><div className="stat-lbl">Committed</div></div>
        <div className="stat"><div className="stat-num">{deciding.length}</div><div className="stat-lbl">Deciding</div></div>
        <div className="stat"><div className="stat-num">{Math.min(...ages)}–{Math.max(...ages)}</div><div className="stat-lbl">Age range</div></div>
      </div>

      {/* The through-line */}
      <div className="card callout">
        <div className="block-label">The Through-Line</div>
        <p className="block-body" style={{ margin: 0 }}>{analysis.pattern}</p>
      </div>

      {/* Hot topics / struggles */}
      <div className="row-between section-gap">
        <h2 className="h2" style={{ margin: 0 }}>Hot Topics &amp; Struggles</h2>
        <span className="pill">by # who named it</span>
      </div>
      <div className="card">
        {analysis.hotTopics.map((h) => (
          <div key={h.theme} className="topic">
            <div className="topic-head">
              <span className="topic-name">{h.theme}</span>
              <span className="topic-count">{h.count}/{total} {h.weight.match(/🔥+/)?.[0] ?? ''}</span>
            </div>
            <div className="topic-bar"><div className="topic-fill" style={{ width: `${(h.count / maxTopic) * 100}%` }} /></div>
            <div className="topic-men">{h.men.join(' · ')}</div>
          </div>
        ))}
      </div>

      {/* Leadership map / key roles */}
      <h2 className="h2 section-gap">Who Needs What From You</h2>
      <div className="card">
        <div className="stack">
          {analysis.leadershipMap.map((r, i) => (
            <div key={i} className="maprow">
              {r.label && <div className="map-label">{r.label}</div>}
              <div className="map-detail">{r.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action items */}
      <h2 className="h2 section-gap">Before Week 1</h2>
      <div className="card">
        <ol className="qlist">
          {analysis.actionItems.map((a, i) => <li key={i}>{a}</li>)}
        </ol>
      </div>

      {/* Three pillars */}
      <h2 className="h2 section-gap">Where Your Time Goes</h2>
      {analysis.pillars.map((p) => (
        <div key={p.n} className="card">
          <div className="block-label">Pillar {p.n} · {p.title}</div>
          <p className="block-body" style={{ margin: 0 }}>{p.body}</p>
        </div>
      ))}

      {/* Emphasis */}
      <div className="card">
        <div className="block-label">Suggested Emphasis · 10 Weeks</div>
        <ul className="tick-list">
          {analysis.emphasis.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </div>

      {/* Roster */}
      <div className="row-between section-gap">
        <h2 className="h2" style={{ margin: 0 }}>Roster</h2>
        <Link to="/leader/members" className="pill">Profiles →</Link>
      </div>
      <div className="card">
        {roster.map((r, i) => {
          const m = MEMBERS.find((x) => x.name === r.name);
          return (
            <div key={i} className="roster-row">
              <div className="roster-info">
                {m ? <Link to={`/leader/member/${m.id}`} className="roster-name">{r.name}</Link> : <span className="roster-name">{r.name}</span>}
                <span className="roster-status">Age {r.age} · {r.status}</span>
              </div>
              {m && <Link to={`/leader/member/${m.id}`} className="chip-btn">Open</Link>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
