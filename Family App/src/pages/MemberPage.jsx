import { useApp } from '../context/AppContext';
import { MEMBERS } from '../data/initialData';
import { formatTimeRange, localToday } from '../lib/utils';
import Calendar from '../components/Calendar';
import styles from './MemberPage.module.css';

const COLOR_VARS = {
  pink: { bg: 'var(--pink-light)', accent: 'var(--pink)', dark: 'var(--pink-dark)', light: 'var(--pink-light)' },
  blue: { bg: 'var(--blue-light)', accent: 'var(--blue)', dark: 'var(--blue-dark)', light: 'var(--blue-light)' },
  lavender: { bg: 'var(--lavender-light)', accent: 'var(--lavender)', dark: 'var(--lavender-dark)', light: 'var(--lavender-light)' },
  mint: { bg: 'var(--mint-light)', accent: 'var(--mint)', dark: 'var(--mint-dark)', light: 'var(--mint-light)' },
  yellow: { bg: 'var(--yellow-light)', accent: 'var(--yellow)', dark: 'var(--yellow-dark)', light: 'var(--yellow-light)' },
};

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function MemberPage({ memberId }) {
  const { chores, events, custody, mealPlan, toggleChore, addEvent, updateEvent, deleteEvent, setCustodyDay } = useApp();
  const member = MEMBERS.find(m => m.id === memberId);
  if (!member) return <div>Member not found</div>;

  const col = COLOR_VARS[member.color];
  const memberChores = chores.filter(c => c.assignedTo === memberId);
  const memberEvents = events.filter(e => e.memberId === memberId);
  const done = memberChores.filter(c => c.completed).length;
  const pct = memberChores.length ? Math.round((done / memberChores.length) * 100) : 0;

  const upcomingEvents = memberEvents
    .filter(e => e.date >= localToday())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const handleAddEvent = (event) => {
    addEvent({ ...event, memberId, color: member.color });
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero} style={{ background: `linear-gradient(135deg, ${col.bg}, var(--card-bg))`, borderColor: col.accent }}>
        <div className={styles.heroEmoji}>{member.emoji}</div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroName} style={{ color: col.dark }}>{member.name}</h1>
          <div className={styles.heroStats}>
            <span>{memberChores.length} chores total</span>
            <span>·</span>
            <span>{done} completed</span>
            <span>·</span>
            <span>{memberEvents.length} events</span>
          </div>
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${pct}%`, background: col.accent }} />
            </div>
            <span className={styles.progressPct} style={{ color: col.dark }}>{pct}%</span>
          </div>
        </div>
      </div>

      <div className={styles.cols}>
        {/* Chores Section */}
        <div className={styles.left}>
          <section className={styles.section} style={{ borderTopColor: col.accent }}>
            <h2 className={styles.sectionTitle}>✅ Chores</h2>
            {memberChores.length === 0 ? (
              <p className={styles.empty}>No chores assigned yet.</p>
            ) : (
              <div className={styles.choreList}>
                {memberChores.map(c => (
                  <div key={c.id} className={`${styles.choreItem} ${c.completed ? styles.choreDone : ''}`}>
                    <button
                      className={styles.checkbox}
                      style={{ borderColor: col.accent, background: c.completed ? col.accent : 'var(--card-bg)' }}
                      onClick={() => toggleChore(c.id)}
                    >
                      {c.completed && '✓'}
                    </button>
                    <div className={styles.choreInfo}>
                      <span className={styles.choreName}>{c.title}</span>
                      <div className={styles.choreMetaRow}>
                        <span className={styles.freqBadge} style={{ background: col.bg, color: col.dark }}>{c.frequency}</span>
                        {c.dueDate && <span className={styles.dueDate}>Due {formatDate(c.dueDate)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Events List */}
          <section className={styles.section} style={{ borderTopColor: col.accent }}>
            <h2 className={styles.sectionTitle}>📋 Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
              <p className={styles.empty}>No upcoming events.</p>
            ) : (
              <div className={styles.eventList}>
                {upcomingEvents.map(e => (
                  <div key={e.id} className={styles.eventItem} style={{ borderLeftColor: col.accent, background: col.bg }}>
                    <span className={styles.evtDate} style={{ color: col.dark }}>{formatDate(e.date)}</span>
                    <span className={styles.evtTitle}>{e.title}</span>
                    {e.time && <span className={styles.evtTime}>{formatTimeRange(e.time, e.endTime)}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Calendar */}
        <div className={styles.right}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 12 }}>📅 {member.name}'s Calendar</h2>
          <Calendar
            events={memberEvents}
            chores={memberChores}
            members={MEMBERS}
            custody={custody}
            onCustodyChange={setCustodyDay}
            mealPlan={mealPlan}
            onAddEvent={handleAddEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
          />
        </div>
      </div>
    </div>
  );
}
