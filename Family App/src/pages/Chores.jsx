import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MEMBERS } from '../data/initialData';
import styles from './Chores.module.css';

const COLOR_VARS = {
  pink: { bg: 'var(--pink-light)', accent: 'var(--pink)', dark: 'var(--pink-dark)' },
  blue: { bg: 'var(--blue-light)', accent: 'var(--blue)', dark: 'var(--blue-dark)' },
  lavender: { bg: 'var(--lavender-light)', accent: 'var(--lavender)', dark: 'var(--lavender-dark)' },
  mint: { bg: 'var(--mint-light)', accent: 'var(--mint)', dark: 'var(--mint-dark)' },
  yellow: { bg: 'var(--yellow-light)', accent: 'var(--yellow)', dark: 'var(--yellow-dark)' },
};

const EMPTY_FORM = { title: '', assignedTo: '', frequency: 'weekly', dueDate: new Date().toISOString().split('T')[0] };

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Chores() {
  const { chores, addChore, deleteChore, toggleChore } = useApp();
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = chores.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !c.completed;
    if (filter === 'done') return c.completed;
    return c.assignedTo === filter;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addChore({ ...form, completed: false });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>✅ Chore List</h1>
        <button className={styles.addBtn} onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ Add Chore'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleAdd}>
          <input
            className={styles.input}
            placeholder="Chore title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <select className={styles.input} value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
            <option value="">Assign to...</option>
            {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
          </select>
          <select className={styles.input} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input
            type="date"
            className={styles.input}
            value={form.dueDate}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
          />
          <button type="submit" className={styles.submitBtn}>Add Chore</button>
        </form>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        {[
          { id: 'all', label: '🗂 All' },
          { id: 'pending', label: '⏳ Pending' },
          { id: 'done', label: '✅ Done' },
          ...MEMBERS.map(m => ({ id: m.id, label: `${m.emoji} ${m.name}` })),
        ].map(f => (
          <button
            key={f.id}
            className={`${styles.filterBtn} ${filter === f.id ? styles.active : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        {MEMBERS.map(m => {
          const mc = chores.filter(c => c.assignedTo === m.id);
          const done = mc.filter(c => c.completed).length;
          const col = COLOR_VARS[m.color];
          return (
            <div key={m.id} className={styles.statCard} style={{ borderColor: col.accent, background: col.bg }}>
              <span className={styles.statEmoji}>{m.emoji}</span>
              <span className={styles.statName}>{m.name}</span>
              <span className={styles.statCount} style={{ color: col.dark }}>{done}/{mc.length}</span>
            </div>
          );
        })}
      </div>

      {/* Chore Table */}
      <div className={styles.tableWrap}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No chores found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Chore</th>
                <th>Assigned To</th>
                <th>Frequency</th>
                <th>Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const member = MEMBERS.find(m => m.id === c.assignedTo);
                const col = member ? COLOR_VARS[member.color] : COLOR_VARS.lavender;
                return (
                  <tr key={c.id} className={c.completed ? styles.doneRow : ''}>
                    <td>
                      <button
                        className={styles.checkbox}
                        style={{ borderColor: col.accent, background: c.completed ? col.accent : 'white' }}
                        onClick={() => toggleChore(c.id)}
                      >
                        {c.completed && '✓'}
                      </button>
                    </td>
                    <td className={styles.choreTitle}>{c.title}</td>
                    <td>
                      {member ? (
                        <span className={styles.badge} style={{ background: col.bg, color: col.dark }}>
                          {member.emoji} {member.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={styles.freqBadge}>{c.frequency}</span>
                    </td>
                    <td className={styles.dateCell}>{c.dueDate ? formatDate(c.dueDate) : '—'}</td>
                    <td>
                      <button className={styles.deleteBtn} onClick={() => deleteChore(c.id)} title="Delete">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
