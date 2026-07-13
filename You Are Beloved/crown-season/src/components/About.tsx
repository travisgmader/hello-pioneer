import { Link } from 'react-router-dom';
import { curriculum, TOTAL_WEEKS } from '../lib/curriculum';
import StagLogo from './StagLogo';
import { useSession } from '../lib/session';
import { signOut, authConfigured, isLeaderEmail } from '../lib/auth';
import { clearLocalCache } from '../lib/storage';

export default function About() {
  const { user } = useSession();

  async function handleSignOut() {
    await signOut();
    clearLocalCache();
  }

  return (
    <div>
      <div className="center" style={{ padding: '10px 0 4px' }}>
        <div style={{ color: 'var(--gold)', filter: 'drop-shadow(0 0 12px rgba(242,202,80,0.35))' }}>
          <StagLogo size={84} crowned />
        </div>
        <h1 className="h1" style={{ marginBottom: 2 }}>The Crown Season</h1>
        <p className="muted" style={{ marginTop: 0 }}>A {TOTAL_WEEKS}-week men’s group</p>
      </div>

      <div className="card">
        <div className="block-label">The Idea</div>
        <p className="block-body" style={{ marginTop: 0 }}>
          Everything for the week — the reading summary, the Scriptures, the discussion questions,
          and the challenge — lives here, split across three short days so it fits real life. No book
          to carry. Add a daily check-in of gratitude and reflection, and you walk into group ready.
        </p>
      </div>

      <div className="card">
        <div className="block-label">Each Week, Three Days</div>
        <div className="stack" style={{ marginTop: 4 }}>
          <div><strong>Day 1 · The Reading</strong><br /><span className="muted">The big idea, your reading, and the first Scriptures.</span></div>
          <div><strong>Day 2 · Go Deeper</strong><br /><span className="muted">The rest of the teaching and time to sit with the Word.</span></div>
          <div><strong>Day 3 · Prepare to Gather</strong><br /><span className="muted">The discussion questions and this week’s challenge.</span></div>
        </div>
      </div>

      <div className="card">
        <div className="block-label">When You Gather</div>
        <p className="block-body" style={{ marginTop: 0, marginBottom: 10 }}>
          Every meeting opens with the same four honest questions:
        </p>
        <ol className="qlist">
          {curriculum.accountabilityQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </div>

      <div className="card">
        <div className="block-label">Your Data</div>
        <p className="block-body" style={{ margin: 0 }}>
          Your progress and journal are saved to your account and synced securely, so they follow
          you to any device you sign in on. They’re private to you — only you can see them.
        </p>
        {authConfigured && user && (
          <div className="section-gap">
            <p className="muted" style={{ margin: '0 0 8px' }}>
              Signed in as <strong>{user.email}</strong>
            </p>
            <button className="btn btn-outline btn-block" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}
      </div>

      {isLeaderEmail(user?.email) && (
        <Link to="/leader" className="btn btn-outline btn-block section-gap">
          ◆ Leader access
        </Link>
      )}

      <p className="center muted" style={{ fontSize: 12, marginTop: 20 }}>
        “Define yourself radically as one beloved by God.” — Brennan Manning
      </p>
    </div>
  );
}
