import { useApp } from '../context/AppContext';
import { MEMBERS } from '../data/initialData';
import Calendar from '../components/Calendar';
import styles from './FamilyCalendar.module.css';

export default function FamilyCalendar() {
  const { events, chores, custody, mealPlan, addEvent, updateEvent, deleteEvent, setCustodyDay } = useApp();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📅 Family Calendar</h1>
        <p className={styles.sub}>All family events and chores in one place</p>
      </div>

      <div className={styles.legend}>
        {MEMBERS.map(m => (
          <span key={m.id} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: `var(--${m.color})` }} />
            {m.emoji} {m.name}
          </span>
        ))}
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--peach)' }} />
          👨‍👩‍👧‍👦 Everyone
        </span>
      </div>

      <Calendar
        events={events}
        chores={chores}
        members={MEMBERS}
        custody={custody}
        onCustodyChange={setCustodyDay}
        mealPlan={mealPlan}
        onAddEvent={addEvent}
        onUpdateEvent={updateEvent}
        onDeleteEvent={deleteEvent}
      />
    </div>
  );
}
