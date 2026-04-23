import { useState } from 'react';
import styles from './Calendar.module.css';
import { formatTimeRange, localToday, localDateStr } from '../lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const CHILD_IDS = ['stella', 'roman', 'layla'];
const PARENTS = [
  { id: 'mom', emoji: '👩', label: 'Mom', color: 'pink' },
  { id: 'dad', emoji: '👨', label: 'Dad', color: 'blue' },
];

export const COLOR_VARS = {
  pink:     { bg: 'var(--pink-light)',     accent: 'var(--pink)',     dark: 'var(--pink-dark)' },
  blue:     { bg: 'var(--blue-light)',     accent: 'var(--blue)',     dark: 'var(--blue-dark)' },
  lavender: { bg: 'var(--lavender-light)', accent: 'var(--lavender)', dark: 'var(--lavender-dark)' },
  mint:     { bg: 'var(--mint-light)',     accent: 'var(--mint)',     dark: 'var(--mint-dark)' },
  yellow:   { bg: 'var(--yellow-light)',   accent: 'var(--yellow)',   dark: 'var(--yellow-dark)' },
  peach:    { bg: 'var(--peach-light)',    accent: 'var(--peach)',    dark: 'var(--peach-dark)' },
};

const parentColor = (parentId) => parentId === 'mom' ? COLOR_VARS.pink : COLOR_VARS.blue;

const MEAL_SLOT_STYLES = {
  Breakfast: { icon: '🌅', bg: 'var(--yellow-light)', accent: 'var(--yellow-dark)' },
  Lunch:     { icon: '☀️',  bg: 'var(--mint-light)',   accent: 'var(--mint-dark)' },
  Dinner:    { icon: '🌙',  bg: 'var(--lavender-light)', accent: 'var(--lavender-dark)' },
};
const MEAL_SLOTS_ORDER = ['Breakfast', 'Lunch', 'Dinner'];

export default function Calendar({
  events = [], chores = [], members = [],
  custody = {}, onCustodyChange,
  mealPlan = {},
  onAddEvent, onDeleteEvent, onUpdateEvent, onToggleChore,
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', memberId: '', time: '09:00', color: 'peach', repeat: 'none', repeatUntil: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = localToday();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const closeDialog = () => { setSelected(null); setShowEventForm(false); setEditingId(null); };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setEditFields({ title: ev.title, time: ev.time || '', endTime: ev.endTime || '', memberId: ev.memberId || '', color: ev.color || 'peach' });
  };

  const handleSaveEdit = (evId) => {
    const color = editFields.memberId
      ? (members.find(m => m.id === editFields.memberId)?.color || 'lavender')
      : 'peach';
    onUpdateEvent?.(evId, { ...editFields, color });
    setEditingId(null);
  };

  const fmt = (d) => {
    const dd = String(d).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const dayEvents = (d) => {
    const dateStr = fmt(d);
    const evs = events.filter(e => e.date === dateStr);
    const choreEvs = chores.filter(c => c.dueDate === dateStr).map(c => ({
      id: c.id,
      title: c.title,
      memberId: c.assignedTo,
      isChore: true,
      completed: c.completed,
      color: members.find(m => m.id === c.assignedTo)?.color || 'lavender',
    }));
    return [...evs, ...choreEvs];
  };

  const selectedDateStr = selected ? fmt(selected) : null;
  const selectedEvents = selected ? dayEvents(selected) : [];

  const generateRepeatDates = (startDate, repeat, until) => {
    if (repeat === 'none') return [startDate];
    const dates = [];
    const end = new Date(until + 'T00:00:00');
    let cur = new Date(startDate + 'T00:00:00');
    let guard = 500;
    while (cur <= end && guard-- > 0) {
      const dow = cur.getDay();
      if (repeat !== 'weekdays' || (dow >= 1 && dow <= 5)) {
        dates.push(localDateStr(cur));
      }
      if (repeat === 'daily' || repeat === 'weekdays') cur.setDate(cur.getDate() + 1);
      else if (repeat === 'weekly') cur.setDate(cur.getDate() + 7);
      else if (repeat === 'monthly') cur.setMonth(cur.getMonth() + 1);
    }
    return dates;
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !selected) return;
    const startDate = fmt(selected);
    const { repeat, repeatUntil, ...eventBase } = newEvent;
    const until = repeat !== 'none' && repeatUntil ? repeatUntil : startDate;
    generateRepeatDates(startDate, repeat, until).forEach(date => onAddEvent?.({ ...eventBase, date }));
    setNewEvent({ title: '', memberId: '', time: '09:00', color: 'peach', repeat: 'none', repeatUntil: '' });
    setShowEventForm(false);
  };

  // Effective display color for an event (transport parent overrides original color)
  const evDisplayColor = (ev) => {
    if (ev.transportParent) return parentColor(ev.transportParent);
    return COLOR_VARS[ev.color] || COLOR_VARS.lavender;
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={styles.cal}>
      <div className={styles.calHeader}>
        <button className={styles.navBtn} onClick={prevMonth}>‹</button>
        <h3 className={styles.monthTitle}>{MONTHS[month]} {year}</h3>
        <button className={styles.navBtn} onClick={nextMonth}>›</button>
      </div>

      {/* Custody legend */}
      <div className={styles.custodyLegend}>
        <span className={styles.legendLabel}>Custody:</span>
        {PARENTS.map(p => {
          const col = parentColor(p.id);
          return (
            <span key={p.id} className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: col.accent }} />
              {p.emoji} {p.label}
            </span>
          );
        })}
        <span className={styles.legendNote}>Click a parent icon on any day to assign custody</span>
      </div>

      <div className={styles.gridScroll}><div className={styles.grid}>
        {DAYS.map(d => <div key={d} className={styles.dayLabel}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className={styles.empty} />;
          const dateStr = fmt(d);
          const evs = dayEvents(d);
          const isToday = dateStr === todayStr;
          const isSel = selected === d;
          const custodyParent = custody[dateStr] || null;
          const custodyCol = custodyParent ? parentColor(custodyParent) : null;

          return (
            <div
              key={d}
              className={`${styles.cell} ${isToday ? styles.today : ''} ${isSel ? styles.selected : ''}`}
              onClick={() => { setSelected(d); setShowEventForm(false); }}
            >
              {/* Day number — cycles custody color on click */}
              <span
                className={styles.dayNum}
                style={custodyCol
                  ? { background: custodyCol.accent, color: 'white', borderRadius: '50%' }
                  : isToday ? {} : {}}
                onClick={onCustodyChange ? (e) => {
                  e.stopPropagation();
                  const next = custodyParent === null ? 'mom' : custodyParent === 'mom' ? 'dad' : null;
                  onCustodyChange(dateStr, next);
                } : undefined}
                title={onCustodyChange ? 'Click to set custody' : undefined}
              >
                {d}
              </span>

              {/* Meal chips — always pinned to top */}
              {MEAL_SLOTS_ORDER.map(slot => {
                const meal = mealPlan[dateStr]?.[slot];
                if (!meal) return null;
                const ms = MEAL_SLOT_STYLES[slot];
                return (
                  <span key={slot} className={styles.mealChip}>
                    {ms.icon} {meal}
                  </span>
                );
              })}

              {/* Event list chips */}
              <div className={styles.evtChips}>
                {evs.slice(0, 3).map(ev => {
                  const col = evDisplayColor(ev);
                  const mem = members.find(m => m.id === ev.memberId);
                  const isTransport = !!ev.transportParent;
                  // Transport chips: solid accent fill + white text to distinguish from custody stripe tint
                  const chipStyle = isTransport
                    ? { background: col.accent, color: 'white', border: 'none', paddingLeft: '5px' }
                    : { background: col.bg, color: col.dark, borderLeft: `3px solid ${col.accent}` };
                  return (
                    <span
                      key={ev.id}
                      className={`${styles.evtChip} ${ev.isChore && ev.completed ? styles.evtChipDone : ''}`}
                      style={chipStyle}
                    >
                      {mem ? `${mem.emoji} ` : (isTransport ? '👥 ' : '')}{ev.isChore ? '✅ ' : ''}{ev.title}
                    </span>
                  );
                })}
                {evs.length > 3 && (
                  <span className={styles.moreChip}>+{evs.length - 3} more</span>
                )}
              </div>

            </div>
          );
        })}
      </div></div>

      {selected && (
        <div className={styles.overlay} onClick={closeDialog}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <div className={styles.detailLeft}>
                <h4 className={styles.detailTitle}>
                  {MONTHS[month]} {selected}
                  {fmt(selected) === todayStr && <span className={styles.todayBadge}>Today</span>}
                </h4>
                {onCustodyChange && (
                  <div className={styles.detailCustody}>
                    <span className={styles.custodyLabel}>Kids at:</span>
                    {PARENTS.map(p => {
                      const isActive = (custody[selectedDateStr] === p.id);
                      const col = parentColor(p.id);
                      return (
                        <button
                          key={p.id}
                          className={`${styles.custodyPill} ${isActive ? styles.custodyPillActive : ''}`}
                          style={isActive ? { background: col.accent, color: 'white', borderColor: col.accent } : { borderColor: col.accent, color: col.dark }}
                          onClick={() => onCustodyChange(selectedDateStr, p.id)}
                        >
                          {p.emoji} {p.label}'s
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className={styles.dialogHeaderActions}>
                {onAddEvent && (
                  <button className={styles.addEvtBtn} onClick={() => setShowEventForm(s => !s)}>
                    {showEventForm ? '✕' : '+ Event'}
                  </button>
                )}
                <button className={styles.dialogClose} onClick={closeDialog}>✕</button>
              </div>
            </div>
          <div className={styles.dialogBody}>

          {showEventForm && onAddEvent && (
            <form className={styles.evtForm} onSubmit={handleAddEvent}>
              <input className={styles.evtInput} placeholder="Event title..." value={newEvent.title} onChange={e => setNewEvent(f => ({ ...f, title: e.target.value }))} required />
              <input type="time" className={styles.evtInput} value={newEvent.time} onChange={e => setNewEvent(f => ({ ...f, time: e.target.value }))} />
              {members.length > 0 && (
                <select
                  className={styles.evtInput}
                  value={newEvent.memberId}
                  onChange={e => {
                    const id = e.target.value;
                    const color = id ? (members.find(m => m.id === id)?.color || 'lavender') : 'peach';
                    setNewEvent(f => ({ ...f, memberId: id, color }));
                  }}
                >
                  <option value="">Everyone</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
                </select>
              )}
              <div className={styles.repeatRow}>
                <span className={styles.repeatLabel}>Repeats</span>
                <select
                  className={styles.evtInput}
                  style={{ flex: 'none', minWidth: 0 }}
                  value={newEvent.repeat}
                  onChange={e => {
                    const repeat = e.target.value;
                    const d = new Date(fmt(selected) + 'T00:00:00');
                    d.setDate(d.getDate() + (repeat === 'daily' || repeat === 'weekdays' ? 14 : repeat === 'weekly' ? 28 : 90));
                    setNewEvent(f => ({ ...f, repeat, repeatUntil: repeat !== 'none' ? localDateStr(d) : '' }));
                  }}
                >
                  <option value="none">Never</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {newEvent.repeat !== 'none' && (
                  <>
                    <span className={styles.repeatLabel}>until</span>
                    <input
                      type="date"
                      className={styles.evtInput}
                      style={{ flex: 'none', minWidth: 0 }}
                      value={newEvent.repeatUntil}
                      min={fmt(selected)}
                      onChange={e => setNewEvent(f => ({ ...f, repeatUntil: e.target.value }))}
                      required
                    />
                  </>
                )}
              </div>
              <button type="submit" className={styles.evtSubmit}>Add</button>
            </form>
          )}

          {/* Meals for selected day */}
          {MEAL_SLOTS_ORDER.some(slot => mealPlan[selectedDateStr]?.[slot]) && (
            <div className={styles.detailMeals}>
              {MEAL_SLOTS_ORDER.map(slot => {
                const meal = mealPlan[selectedDateStr]?.[slot];
                if (!meal) return null;
                const ms = MEAL_SLOT_STYLES[slot];
                return (
                  <div key={slot} className={styles.detailMealRow} style={{ background: ms.bg, borderLeftColor: ms.accent }}>
                    <span className={styles.detailMealIcon}>{ms.icon}</span>
                    <span className={styles.detailMealSlot} style={{ color: ms.accent }}>{slot}</span>
                    <span className={styles.detailMealName}>{meal}</span>
                  </div>
                );
              })}
            </div>
          )}

          {selectedEvents.length === 0 ? (
            <p className={styles.noEvts}>No events or chores.</p>
          ) : (
            <div className={styles.evtList}>
              {selectedEvents.map(ev => {
                const col = evDisplayColor(ev);
                const member = members.find(m => m.id === ev.memberId);
                const isChildEvent = !ev.isChore && CHILD_IDS.includes(ev.memberId);

                const isTransport = !!ev.transportParent;
                // Transport events: solid left bar + lightly tinted bg using a different shade than custody stripe
                const itemStyle = isTransport
                  ? { borderLeftColor: col.accent, borderLeftWidth: '5px', background: `${col.accent}18` }
                  : { borderLeftColor: col.accent, background: col.bg };

                const isEditing = editingId === ev.id;

                return (
                  <div key={ev.id}
                    className={`${styles.evtItem} ${ev.isChore && ev.completed ? styles.evtDone : ''}`}
                    style={itemStyle}
                  >
                    {isEditing ? (
                      <form className={styles.evtEditForm} onSubmit={e => { e.preventDefault(); handleSaveEdit(ev.id); }}>
                        <input
                          className={styles.evtInput}
                          value={editFields.title}
                          onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                          required
                          autoFocus
                          placeholder="Event title"
                        />
                        <div className={styles.timeRow}>
                          <label className={styles.timeLabel}>
                            Start
                            <input
                              type="time"
                              className={styles.evtInput}
                              value={editFields.time}
                              onChange={e => setEditFields(f => ({ ...f, time: e.target.value }))}
                            />
                          </label>
                          <label className={styles.timeLabel}>
                            End
                            <input
                              type="time"
                              className={styles.evtInput}
                              value={editFields.endTime}
                              onChange={e => setEditFields(f => ({ ...f, endTime: e.target.value }))}
                            />
                          </label>
                        </div>
                        {members.length > 0 && (
                          <select
                            className={styles.evtInput}
                            value={editFields.memberId}
                            onChange={e => setEditFields(f => ({ ...f, memberId: e.target.value }))}
                          >
                            <option value="">Everyone</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
                          </select>
                        )}
                        <div className={styles.evtEditActions}>
                          <button type="submit" className={styles.evtSave}>Save</button>
                          <button type="button" className={styles.evtDel} onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className={styles.evtItemMain}>
                          {ev.isChore && onToggleChore ? (
                            <button
                              className={styles.choreCheck}
                              style={{
                                borderColor: col.accent,
                                background: ev.completed ? col.accent : 'var(--card-bg)',
                                color: 'white',
                              }}
                              onClick={() => onToggleChore(ev.id)}
                              title={ev.completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {ev.completed ? '✓' : ''}
                            </button>
                          ) : (
                            <span className={styles.evtDot} style={{ background: col.accent }} />
                          )}
                          <span className={styles.evtName}>
                            {!ev.isChore && isTransport && member ? `${member.emoji} ` : ''}{ev.title}
                            {ev.time && !ev.isChore && (
                              <span className={styles.evtTime}>{formatTimeRange(ev.time, ev.endTime)}</span>
                            )}
                          </span>
                          {member && <span className={styles.evtMember}>{member.emoji}</span>}
                        </div>

                        {/* Parent pickup/dropoff selector for child events */}
                        {isChildEvent && onUpdateEvent && (
                          <div className={styles.transportRow}>
                            <span className={styles.transportLabel}>👥 Pickup/Dropoff:</span>
                            {PARENTS.map(p => {
                              const isActive = ev.transportParent === p.id;
                              const pcol = parentColor(p.id);
                              return (
                                <button
                                  key={p.id}
                                  className={`${styles.transportBtn} ${isActive ? styles.transportActive : ''}`}
                                  style={isActive
                                    ? { background: pcol.accent, color: 'white', borderColor: pcol.accent }
                                    : { borderColor: pcol.accent, color: pcol.dark }}
                                  onClick={() => onUpdateEvent(ev.id, {
                                    transportParent: ev.transportParent === p.id ? null : p.id,
                                    color: ev.transportParent === p.id ? ev._origColor || ev.color : ev.color,
                                  })}
                                >
                                  {p.emoji} {p.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className={styles.evtActions}>
                          {onUpdateEvent && !ev.isChore && (
                            <button className={styles.evtEdit} onClick={() => startEdit(ev)} title="Edit">✎</button>
                          )}
                          {onDeleteEvent && !ev.isChore && (
                            <button className={styles.evtDel} onClick={() => onDeleteEvent(ev.id)} title="Delete">🗑</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
