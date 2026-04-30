import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MEMBERS, MEAL_SLOTS } from '../data/initialData';
import { localDateStr } from '../lib/utils';
import { PARENT_EMAILS } from '../lib/allowedEmails';
import styles from './Meals.module.css';

const MEMBER_MAP = Object.fromEntries(MEMBERS.map(m => [m.id, m]));

const SLOT_COLORS = {
  Breakfast: { bg: 'var(--yellow-light)', accent: 'var(--yellow)', dark: 'var(--yellow-dark)' },
  Lunch:     { bg: 'var(--mint-light)',   accent: 'var(--mint)',   dark: 'var(--mint-dark)' },
  Dinner:    { bg: 'var(--lavender-light)', accent: 'var(--lavender)', dark: 'var(--lavender-dark)' },
};

const MEMBER_COLORS = {
  mom:    { bg: 'var(--pink-light)',     accent: 'var(--pink)',     dark: 'var(--pink-dark)' },
  dad:    { bg: 'var(--blue-light)',     accent: 'var(--blue)',     dark: 'var(--blue-dark)' },
  stella: { bg: 'var(--lavender-light)', accent: 'var(--lavender)', dark: 'var(--lavender-dark)' },
  roman:  { bg: 'var(--mint-light)',     accent: 'var(--mint)',     dark: 'var(--mint-dark)' },
  layla:  { bg: 'var(--yellow-light)',   accent: 'var(--yellow)',   dark: 'var(--yellow-dark)' },
};

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDate(d) { return localDateStr(d); }
function fmtShort(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Meals() {
  const { mealPlan, mealRecs, setMeal, addMealRec, deleteMealRec, voteMealRec, user } = useApp();
  const isParent = PARENT_EMAILS.includes(user?.email?.toLowerCase());

  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [editing, setEditing] = useState(null); // { dateStr, slot }
  const [editValue, setEditValue] = useState('');
  const [recForm, setRecForm] = useState({ title: '', category: 'Dinner', suggestedBy: 'mom' });
  const [showRecForm, setShowRecForm] = useState(false);
  const [recFilter, setRecFilter] = useState('All');

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });

  const weekDays = DAYS_OF_WEEK.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekEndStr = fmtShort(weekDays[6]);
  const weekStartStr = fmtShort(weekDays[0]);

  const startEdit = (dateStr, slot, current) => {
    setEditing({ dateStr, slot });
    setEditValue(current || '');
  };

  const commitEdit = () => {
    if (editing) {
      setMeal(editing.dateStr, editing.slot, editValue.trim());
      setEditing(null);
    }
  };

  const assignRec = (rec, dateStr, slot) => {
    setMeal(dateStr, slot, rec.title);
  };

  const handleAddRec = (e) => {
    e.preventDefault();
    if (!recForm.title.trim()) return;
    addMealRec(recForm);
    setRecForm({ title: '', category: 'Dinner', suggestedBy: 'mom' });
    setShowRecForm(false);
  };

  const filteredRecs = recFilter === 'All' ? mealRecs : mealRecs.filter(r => r.category === recFilter);
  const sortedRecs = [...filteredRecs].sort((a, b) => b.votes.length - a.votes.length);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>🍽️ Weekly Meals</h1>
      </div>

      {/* Week nav */}
      <div className={styles.weekNav}>
        <button className={styles.weekBtn} onClick={prevWeek}>‹</button>
        <span className={styles.weekRange}>{weekStartStr} — {weekEndStr}</span>
        <button className={styles.weekBtn} onClick={nextWeek}>›</button>
      </div>

      {/* Meal grid */}
      <div className={styles.gridScroll}><div className={styles.grid}>
        {/* Header row */}
        <div className={styles.slotHeader} />
        {weekDays.map((d, i) => {
          const isToday = fmtDate(d) === fmtDate(new Date());
          return (
            <div key={i} className={`${styles.dayHeader} ${isToday ? styles.todayHeader : ''}`}>
              <span className={styles.dayName}>{DAYS_OF_WEEK[i]}</span>
              <span className={styles.dayDate}>{d.getDate()}</span>
            </div>
          );
        })}

        {/* Meal slot rows */}
        {MEAL_SLOTS.map(slot => {
          const col = SLOT_COLORS[slot];
          return (
            <>
              <div key={`label-${slot}`} className={styles.slotLabel} style={{ background: col.bg, color: col.dark }}>
                {slot === 'Breakfast' ? '🌅' : slot === 'Lunch' ? '☀️' : '🌙'} {slot}
              </div>
              {weekDays.map((d, i) => {
                const dateStr = fmtDate(d);
                const value = mealPlan[dateStr]?.[slot] || '';
                const isEditing = editing?.dateStr === dateStr && editing?.slot === slot;
                return (
                  <div
                    key={`${slot}-${i}`}
                    className={`${styles.cell} ${value ? styles.cellFilled : styles.cellEmpty}`}
                    style={value ? { background: col.bg } : {}}
                  >
                    {isEditing ? (
                      <div className={styles.editWrap}>
                        <input
                          autoFocus
                          className={styles.editInput}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                          placeholder="Meal name..."
                        />
                        <div className={styles.editActions}>
                          <button className={styles.editSave} style={{ background: col.accent }} onClick={commitEdit}>✓</button>
                          <button className={styles.editCancel} onClick={() => setEditing(null)}>✕</button>
                        </div>
                      </div>
                    ) : isParent ? (
                      <button className={styles.cellBtn} onClick={() => startEdit(dateStr, slot, value)}>
                        {value ? (
                          <span className={styles.mealName}>{value}</span>
                        ) : (
                          <span className={styles.addMeal}>+ Add</span>
                        )}
                      </button>
                    ) : (
                      <div className={styles.cellBtn}>
                        {value ? <span className={styles.mealName}>{value}</span> : <span className={styles.addMeal} style={{ opacity: 0.3 }}>—</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })}
      </div></div>

      {/* Recommendations */}
      <section className={styles.recSection}>
        <div className={styles.recHeader}>
          <h2 className={styles.recTitle}>⭐ Meal Recommendations</h2>
          <button className={styles.addRecBtn} onClick={() => setShowRecForm(s => !s)}>
            {showRecForm ? '✕ Cancel' : '+ Recommend a Meal'}
          </button>
        </div>

        {showRecForm && (
          <form className={styles.recForm} onSubmit={handleAddRec}>
            <input
              className={styles.recInput}
              placeholder="Meal name..."
              value={recForm.title}
              onChange={e => setRecForm(f => ({ ...f, title: e.target.value }))}
              required
            />
            <select className={styles.recInput} value={recForm.category} onChange={e => setRecForm(f => ({ ...f, category: e.target.value }))}>
              {MEAL_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={styles.recInput} value={recForm.suggestedBy} onChange={e => setRecForm(f => ({ ...f, suggestedBy: e.target.value }))}>
              {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
            </select>
            <button type="submit" className={styles.recSubmit}>Add Recommendation</button>
          </form>
        )}

        {/* Filter tabs */}
        <div className={styles.recFilters}>
          {['All', ...MEAL_SLOTS].map(f => (
            <button key={f} className={`${styles.recFilter} ${recFilter === f ? styles.recFilterActive : ''}`} onClick={() => setRecFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className={styles.recGrid}>
          {sortedRecs.length === 0 && <p className={styles.empty}>No recommendations yet.</p>}
          {sortedRecs.map(rec => {
            const suggester = MEMBER_MAP[rec.suggestedBy];
            const col = MEMBER_COLORS[rec.suggestedBy] || MEMBER_COLORS.mom;
            const slotCol = SLOT_COLORS[rec.category];
            return (
              <div key={rec.id} className={styles.recCard}>
                <div className={styles.recCardTop}>
                  <span className={styles.recSlotBadge} style={{ background: slotCol.bg, color: slotCol.dark }}>
                    {rec.category}
                  </span>
                  {isParent && <button className={styles.recDelete} onClick={() => deleteMealRec(rec.id)}>✕</button>}
                </div>
                <div className={styles.recName}>{rec.title}</div>
                <div className={styles.recMeta}>
                  <span className={styles.recBy} style={{ background: col.bg, color: col.dark }}>
                    {suggester?.emoji} {suggester?.name}
                  </span>
                </div>

                {/* Votes */}
                <div className={styles.recVotes}>
                  {MEMBERS.map(m => {
                    const voted = rec.votes.includes(m.id);
                    const mc = MEMBER_COLORS[m.id];
                    return (
                      <button
                        key={m.id}
                        className={`${styles.voteBtn} ${voted ? styles.votedBtn : ''}`}
                        style={voted ? { background: mc.accent, color: 'white' } : { borderColor: mc.accent, color: mc.dark }}
                        title={`${m.name} ${voted ? '(voted)' : ''}`}
                        onClick={() => voteMealRec(rec.id, m.id)}
                      >
                        {m.emoji}
                      </button>
                    );
                  })}
                  {rec.votes[0] && (
                    <span className={styles.voteCount}>
                      {MEMBER_MAP[rec.votes[0]]?.emoji} picks this
                    </span>
                  )}
                </div>

                {/* Assign to a day — parents only */}
                {isParent && (
                  <div className={styles.assignRow}>
                    <span className={styles.assignLabel}>Add to week:</span>
                    <div className={styles.assignDays}>
                      {weekDays.map((d, i) => (
                        <button
                          key={i}
                          className={styles.assignDay}
                          title={`${DAYS_OF_WEEK[i]} ${rec.category}`}
                          onClick={() => assignRec(rec, fmtDate(d), rec.category)}
                        >
                          {DAYS_OF_WEEK[i]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
