import { useApp } from '../context/AppContext';
import { MEMBERS } from '../data/initialData';
import styles from './Dashboard.module.css';

const COLOR_VARS = {
  pink: { bg: 'var(--pink-light)', accent: 'var(--pink)', dark: 'var(--pink-dark)' },
  blue: { bg: 'var(--blue-light)', accent: 'var(--blue)', dark: 'var(--blue-dark)' },
  lavender: { bg: 'var(--lavender-light)', accent: 'var(--lavender)', dark: 'var(--lavender-dark)' },
  mint: { bg: 'var(--mint-light)', accent: 'var(--mint)', dark: 'var(--mint-dark)' },
  yellow: { bg: 'var(--yellow-light)', accent: 'var(--yellow)', dark: 'var(--yellow-dark)' },
};

function today() { return new Date().toISOString().split('T')[0]; }

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Dashboard({ setPage }) {
  const { chores, events, toggleChore } = useApp();
  const todayStr = today();

  const todayChores = chores.filter(c => c.dueDate === todayStr);
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>🌷 Family Hub</h1>
        <p className={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Member Cards */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>👨‍👩‍👧‍👦 Family Members</h2>
        <div className={styles.memberGrid}>
          {MEMBERS.map(m => {
            const c = COLOR_VARS[m.color];
            const memberChores = chores.filter(ch => ch.assignedTo === m.id);
            const done = memberChores.filter(ch => ch.completed).length;
            const pct = memberChores.length ? Math.round((done / memberChores.length) * 100) : 0;
            return (
              <button
                key={m.id}
                className={styles.memberCard}
                style={{ background: c.bg, borderColor: c.accent }}
                onClick={() => setPage(m.id)}
              >
                <div className={styles.memberEmoji}>{m.emoji}</div>
                <div className={styles.memberName}>{m.name}</div>
                <div className={styles.memberStats}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%`, background: c.accent }} />
                  </div>
                  <span className={styles.progressLabel}>{done}/{memberChores.length} chores</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className={styles.columns}>
        {/* Today's Chores */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>✅ Today's Chores</h2>
          {todayChores.length === 0 ? (
            <div className={styles.empty}>No chores due today! 🎉</div>
          ) : (
            <div className={styles.choreList}>
              {todayChores.map(c => {
                const member = MEMBERS.find(m => m.id === c.assignedTo);
                const col = member ? COLOR_VARS[member.color] : COLOR_VARS.lavender;
                return (
                  <div key={c.id} className={`${styles.choreItem} ${c.completed ? styles.done : ''}`}>
                    <button
                      className={styles.checkbox}
                      style={{ borderColor: col.accent, background: c.completed ? col.accent : 'white' }}
                      onClick={() => toggleChore(c.id)}
                    >
                      {c.completed && '✓'}
                    </button>
                    <div className={styles.choreInfo}>
                      <span className={styles.choreName}>{c.title}</span>
                      {member && (
                        <span className={styles.choreAssignee} style={{ background: col.bg, color: col.dark }}>
                          {member.emoji} {member.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📅 Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <div className={styles.empty}>No upcoming events.</div>
          ) : (
            <div className={styles.eventList}>
              {upcomingEvents.map(e => {
                const member = MEMBERS.find(m => m.id === e.memberId);
                const col = COLOR_VARS[e.color] || COLOR_VARS.lavender;
                return (
                  <div key={e.id} className={styles.eventItem} style={{ borderLeftColor: col.accent }}>
                    <div className={styles.eventDate} style={{ color: col.dark }}>{formatDate(e.date)}</div>
                    <div className={styles.eventTitle}>{e.title}</div>
                    {member && (
                      <span className={styles.eventMember} style={{ background: col.bg, color: col.dark }}>
                        {member.emoji} {member.name}
                      </span>
                    )}
                    {!e.memberId && <span className={styles.eventMember} style={{ background: 'var(--peach-light)', color: 'var(--peach-dark)' }}>👨‍👩‍👧‍👦 Everyone</span>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
