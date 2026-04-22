import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MEMBERS, MEAL_SLOTS } from '../data/initialData';
import { formatTimeRange } from '../lib/utils';
import styles from './Dashboard.module.css';

const PARENTS = [
  { id: 'mom', emoji: '👩', label: 'Mom' },
  { id: 'dad', emoji: '👨', label: 'Dad' },
];
const CHILD_IDS = ['stella', 'roman', 'layla'];
const PARENT_COLORS = {
  mom: { accent: 'var(--pink)', dark: 'var(--pink-dark)', bg: 'var(--pink-light)' },
  dad: { accent: 'var(--blue)', dark: 'var(--blue-dark)', bg: 'var(--blue-light)' },
};

const COLOR_VARS = {
  pink: { bg: 'var(--pink-light)', accent: 'var(--pink)', dark: 'var(--pink-dark)' },
  blue: { bg: 'var(--blue-light)', accent: 'var(--blue)', dark: 'var(--blue-dark)' },
  lavender: { bg: 'var(--lavender-light)', accent: 'var(--lavender)', dark: 'var(--lavender-dark)' },
  mint: { bg: 'var(--mint-light)', accent: 'var(--mint)', dark: 'var(--mint-dark)' },
  yellow: { bg: 'var(--yellow-light)', accent: 'var(--yellow)', dark: 'var(--yellow-dark)' },
  peach: { bg: 'var(--peach-light)', accent: 'var(--peach)', dark: 'var(--peach-dark)' },
};

function today() { return new Date().toISOString().split('T')[0]; }

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const MEAL_ICONS = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' };

export default function Dashboard({ setPage }) {
  const { chores, events, mealPlan, groceries, toggleChore, updateEvent, deleteEvent } = useApp();
  const todayStr = today();
  const [activeEvent, setActiveEvent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({});

  const openModal = (e) => { setActiveEvent(e); setEditing(false); setEditFields({}); };
  const closeModal = () => { setActiveEvent(null); setEditing(false); };

  const startEdit = (e) => {
    setEditing(true);
    setEditFields({ title: e.title, time: e.time || '', endTime: e.endTime || '', memberId: e.memberId || '' });
  };

  const saveEdit = () => {
    updateEvent(activeEvent.id, {
      title: editFields.title,
      time: editFields.time || null,
      endTime: editFields.endTime || null,
      memberId: editFields.memberId || null,
      color: MEMBERS.find(m => m.id === editFields.memberId)?.color || activeEvent.color,
    });
    setActiveEvent(ev => ({ ...ev, ...editFields }));
    setEditing(false);
  };

  const handleDelete = (id) => { deleteEvent(id); closeModal(); };

  const todayChores = chores.filter(c => c.dueDate === todayStr);
  const todayMeals = MEAL_SLOTS.map(slot => ({ slot, meal: mealPlan[todayStr]?.[slot] || '' }));
  const pendingGroceries = groceries.filter(g => !g.checked).slice(0, 8);
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Family Plan</h1>
        <p className={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className={styles.columns}>
        {/* Today's Chores */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <button className={styles.titleLink} onClick={() => setPage('chores')}>✅</button>
            {' '}Today's Chores
          </h2>
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
                      style={{ borderColor: col.accent, background: c.completed ? col.accent : 'var(--card-bg)' }}
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
          <h2 className={styles.sectionTitle}>
            <button className={styles.titleLink} onClick={() => setPage('calendar')}>📅</button>
            {' '}Upcoming Events
          </h2>
          {upcomingEvents.length === 0 ? (
            <div className={styles.empty}>No upcoming events.</div>
          ) : (
            <div className={styles.eventList}>
              {upcomingEvents.map(e => {
                const member = MEMBERS.find(m => m.id === e.memberId);
                const col = COLOR_VARS[e.color] || COLOR_VARS.lavender;
                return (
                  <div key={e.id} className={styles.eventItem} style={{ borderLeftColor: col.accent }} onClick={() => openModal(e)}>
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

      <div className={styles.columns}>
        {/* Today's Meals */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <button className={styles.titleLink} onClick={() => setPage('meals')}>🍽️</button>
            {' '}Today's Meals
          </h2>
          <div className={styles.mealList}>
            {todayMeals.map(({ slot, meal }) => (
              <div key={slot} className={styles.mealRow}>
                <span className={styles.mealIcon}>{MEAL_ICONS[slot]}</span>
                <span className={styles.mealSlot}>{slot}</span>
                {meal
                  ? <span className={styles.mealName}>{meal}</span>
                  : <span className={styles.mealEmpty}>Not planned</span>
                }
              </div>
            ))}
          </div>
        </section>

        {/* Groceries */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <button className={styles.titleLink} onClick={() => setPage('groceries')}>🛒</button>
            {' '}Groceries
          </h2>
          {pendingGroceries.length === 0 ? (
            <div className={styles.empty}>All done! 🎉</div>
          ) : (
            <div className={styles.groceryList}>
              {pendingGroceries.map(g => (
                <div key={g.id} className={styles.groceryItem}>
                  <span className={styles.groceryDot} />
                  <span className={styles.groceryName}>{g.name}</span>
                  {g.qty && <span className={styles.groceryQty}>{g.qty}</span>}
                </div>
              ))}
              {groceries.filter(g => !g.checked).length > 8 && (
                <button className={styles.viewAll} onClick={() => setPage('groceries')}>
                  +{groceries.filter(g => !g.checked).length - 8} more items
                </button>
              )}
            </div>
          )}
        </section>
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
      {/* Event detail modal */}
      {activeEvent && (() => {
        const e = activeEvent;
        const member = MEMBERS.find(m => m.id === e.memberId);
        const col = COLOR_VARS[e.color] || COLOR_VARS.lavender;
        const isChildEvent = CHILD_IDS.includes(e.memberId);
        return (
          <div className={styles.overlay} onClick={closeModal}>
            <div className={styles.modal} onClick={ev => ev.stopPropagation()}>
              <div className={styles.modalHeader} style={{ borderLeftColor: col.accent, background: col.bg }}>
                <div className={styles.modalTitle} style={{ color: col.dark }}>{e.title}</div>
                <div className={styles.modalHeaderActions}>
                  {!editing && (
                    <>
                      <button className={styles.modalEdit} onClick={() => startEdit(e)} title="Edit">✎</button>
                      <button className={styles.modalDelete} onClick={() => handleDelete(e.id)} title="Delete">🗑</button>
                    </>
                  )}
                  <button className={styles.modalClose} onClick={closeModal}>✕</button>
                </div>
              </div>
              <div className={styles.modalBody}>
                {editing ? (
                  <form onSubmit={ev => { ev.preventDefault(); saveEdit(); }} className={styles.editForm}>
                    <label className={styles.editLabel}>Title</label>
                    <input
                      className={styles.editInput}
                      value={editFields.title}
                      onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                      required
                      autoFocus
                    />
                    <div className={styles.timeRow}>
                      <label className={styles.timeLabel}>
                        Start
                        <input
                          type="time"
                          className={styles.editInput}
                          value={editFields.time}
                          onChange={e => setEditFields(f => ({ ...f, time: e.target.value }))}
                        />
                      </label>
                      <label className={styles.timeLabel}>
                        End
                        <input
                          type="time"
                          className={styles.editInput}
                          value={editFields.endTime}
                          onChange={e => setEditFields(f => ({ ...f, endTime: e.target.value }))}
                        />
                      </label>
                    </div>
                    <label className={styles.editLabel}>Who</label>
                    <select
                      className={styles.editInput}
                      value={editFields.memberId}
                      onChange={e => setEditFields(f => ({ ...f, memberId: e.target.value }))}
                    >
                      <option value="">Everyone</option>
                      {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
                    </select>
                    <div className={styles.editActions}>
                      <button type="submit" className={styles.editSave}>Save</button>
                      <button type="button" className={styles.editCancel} onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>📅 Date</span>
                      <span>{formatDate(e.date)}</span>
                    </div>
                    {e.time && (
                      <div className={styles.modalRow}>
                        <span className={styles.modalLabel}>🕐 Time</span>
                        <span>{formatTimeRange(e.time, e.endTime)}</span>
                      </div>
                    )}
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>👤 Who</span>
                      {member
                        ? <span className={styles.eventMember} style={{ background: col.bg, color: col.dark }}>{member.emoji} {member.name}</span>
                        : <span className={styles.eventMember} style={{ background: 'var(--peach-light)', color: 'var(--peach-dark)' }}>👨‍👩‍👧‍👦 Everyone</span>
                      }
                    </div>
                    {isChildEvent && (
                      <div className={styles.modalRow} style={{ flexWrap: 'wrap', gap: 8 }}>
                        <span className={styles.modalLabel}>👥 Pickup</span>
                        <div className={styles.transportBtns}>
                          {PARENTS.map(p => {
                            const isActive = e.transportParent === p.id;
                            const pcol = PARENT_COLORS[p.id];
                            return (
                              <button
                                key={p.id}
                                className={`${styles.transportBtn} ${isActive ? styles.transportActive : ''}`}
                                style={isActive
                                  ? { background: pcol.accent, color: 'white', borderColor: pcol.accent }
                                  : { borderColor: pcol.accent, color: pcol.dark }}
                                onClick={() => {
                                  const updated = {
                                    transportParent: e.transportParent === p.id ? null : p.id,
                                  };
                                  updateEvent(e.id, updated);
                                  setActiveEvent(ev => ({ ...ev, ...updated }));
                                }}
                              >
                                {p.emoji} {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
