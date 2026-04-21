import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MEMBERS } from '../data/initialData';
import styles from './Groceries.module.css';

const MEMBER_MAP = Object.fromEntries(MEMBERS.map(m => [m.id, m]));

const MEMBER_COLORS = {
  mom:    { bg: 'var(--pink-light)',     accent: 'var(--pink)',     dark: 'var(--pink-dark)' },
  dad:    { bg: 'var(--blue-light)',     accent: 'var(--blue)',     dark: 'var(--blue-dark)' },
  stella: { bg: 'var(--lavender-light)', accent: 'var(--lavender)', dark: 'var(--lavender-dark)' },
  roman:  { bg: 'var(--mint-light)',     accent: 'var(--mint)',     dark: 'var(--mint-dark)' },
  layla:  { bg: 'var(--yellow-light)',   accent: 'var(--yellow)',   dark: 'var(--yellow-dark)' },
};

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Snacks', 'Beverages', 'Other', 'Requested'];

const EMPTY_ITEM = { name: '', qty: '', category: 'Produce', addedBy: 'mom' };

export default function Groceries() {
  const { groceries, groceryRequests, addGrocery, toggleGrocery, deleteGrocery, addGroceryRequest, approveRequest, deleteGroceryRequest } = useApp();

  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [showItemForm, setShowItemForm] = useState(false);
  const [reqForm, setReqForm] = useState({ name: '', requestedBy: 'stella', notes: '' });
  const [showReqForm, setShowReqForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;
    addGrocery(itemForm);
    setItemForm(EMPTY_ITEM);
    setShowItemForm(false);
  };

  const handleAddRequest = (e) => {
    e.preventDefault();
    if (!reqForm.name.trim()) return;
    addGroceryRequest(reqForm);
    setReqForm({ name: '', requestedBy: 'stella', notes: '' });
    setShowReqForm(false);
  };

  // Group by category
  const categories = ['All', ...CATEGORIES.filter(c => groceries.some(g => g.category === c))];
  const filtered = categoryFilter === 'All' ? groceries : groceries.filter(g => g.category === categoryFilter);

  const grouped = filtered.reduce((acc, g) => {
    acc[g.category] = acc[g.category] || [];
    acc[g.category].push(g);
    return acc;
  }, {});

  const pending = groceryRequests.filter(r => r.status === 'pending');
  const approved = groceryRequests.filter(r => r.status === 'approved');
  const checkedCount = groceries.filter(g => g.checked).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>🛒 Groceries</h1>
        <div className={styles.headerStats}>
          <span className={styles.stat}>{groceries.length - checkedCount} items left</span>
          <span className={styles.statDone}>{checkedCount} got ✓</span>
        </div>
      </div>

      <div className={styles.cols}>
        {/* ── Grocery List ── */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <h2 className={styles.colTitle}>📋 Grocery List</h2>
            <button className={styles.addBtn} onClick={() => setShowItemForm(s => !s)}>
              {showItemForm ? '✕' : '+ Add Item'}
            </button>
          </div>

          {showItemForm && (
            <form className={styles.form} onSubmit={handleAddItem}>
              <input
                className={styles.input}
                placeholder="Item name..."
                value={itemForm.name}
                onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className={styles.input}
                placeholder="Qty (e.g. 2 lbs)"
                value={itemForm.qty}
                onChange={e => setItemForm(f => ({ ...f, qty: e.target.value }))}
              />
              <select className={styles.input} value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={styles.input} value={itemForm.addedBy} onChange={e => setItemForm(f => ({ ...f, addedBy: e.target.value }))}>
                {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
              </select>
              <button type="submit" className={styles.submitBtn}>Add</button>
            </form>
          )}

          {/* Category filters */}
          <div className={styles.filters}>
            {categories.map(c => (
              <button
                key={c}
                className={`${styles.filterBtn} ${categoryFilter === c ? styles.filterActive : ''}`}
                onClick={() => setCategoryFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Items grouped by category */}
          <div className={styles.itemGroups}>
            {Object.keys(grouped).length === 0 && <p className={styles.empty}>No items. Add one above!</p>}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className={styles.catGroup}>
                <div className={styles.catLabel}>{cat}</div>
                {items.map(g => {
                  const adder = MEMBER_MAP[g.addedBy];
                  const col = MEMBER_COLORS[g.addedBy] || MEMBER_COLORS.mom;
                  return (
                    <div key={g.id} className={`${styles.item} ${g.checked ? styles.itemChecked : ''}`}>
                      <button
                        className={styles.checkbox}
                        style={{ borderColor: col.accent, background: g.checked ? col.accent : 'white' }}
                        onClick={() => toggleGrocery(g.id)}
                      >
                        {g.checked && '✓'}
                      </button>
                      <span className={styles.itemName}>{g.name}</span>
                      {g.qty && <span className={styles.itemQty}>{g.qty}</span>}
                      {adder && (
                        <span className={styles.itemBy} style={{ background: col.bg, color: col.dark }}>
                          {adder.emoji}
                        </span>
                      )}
                      <button className={styles.deleteBtn} onClick={() => deleteGrocery(g.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Grocery Requests ── */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <h2 className={styles.colTitle}>🙋 Requests</h2>
            <button className={styles.addBtn} style={{ background: 'var(--peach)', }} onClick={() => setShowReqForm(s => !s)}>
              {showReqForm ? '✕' : '+ Request Item'}
            </button>
          </div>

          {showReqForm && (
            <form className={styles.form} onSubmit={handleAddRequest}>
              <input
                className={styles.input}
                placeholder="What do you want?"
                value={reqForm.name}
                onChange={e => setReqForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className={styles.input}
                placeholder="Notes (brand, size, etc.)"
                value={reqForm.notes}
                onChange={e => setReqForm(f => ({ ...f, notes: e.target.value }))}
              />
              <select className={styles.input} value={reqForm.requestedBy} onChange={e => setReqForm(f => ({ ...f, requestedBy: e.target.value }))}>
                {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
              </select>
              <button type="submit" className={styles.submitBtn} style={{ background: 'var(--peach)' }}>Request</button>
            </form>
          )}

          {/* Pending requests */}
          <div className={styles.reqSection}>
            <div className={styles.reqSectionLabel}>⏳ Pending ({pending.length})</div>
            {pending.length === 0 && <p className={styles.empty}>No pending requests.</p>}
            {pending.map(r => {
              const requester = MEMBER_MAP[r.requestedBy];
              const col = MEMBER_COLORS[r.requestedBy] || MEMBER_COLORS.mom;
              return (
                <div key={r.id} className={styles.reqCard} style={{ borderLeftColor: col.accent }}>
                  <div className={styles.reqTop}>
                    <span className={styles.reqName}>{r.name}</span>
                    <div className={styles.reqActions}>
                      <button
                        className={styles.approveBtn}
                        onClick={() => approveRequest(r.id)}
                        title="Approve & add to list"
                      >
                        ✓ Add to List
                      </button>
                      <button className={styles.deleteBtn} onClick={() => deleteGroceryRequest(r.id)}>✕</button>
                    </div>
                  </div>
                  {r.notes && <span className={styles.reqNotes}>"{r.notes}"</span>}
                  <span className={styles.reqBy} style={{ background: col.bg, color: col.dark }}>
                    {requester?.emoji} {requester?.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Approved requests */}
          {approved.length > 0 && (
            <div className={styles.reqSection}>
              <div className={styles.reqSectionLabel} style={{ color: 'var(--mint-dark)' }}>✅ Approved ({approved.length})</div>
              {approved.map(r => {
                const requester = MEMBER_MAP[r.requestedBy];
                const col = MEMBER_COLORS[r.requestedBy] || MEMBER_COLORS.mom;
                return (
                  <div key={r.id} className={`${styles.reqCard} ${styles.reqApproved}`} style={{ borderLeftColor: 'var(--mint)' }}>
                    <div className={styles.reqTop}>
                      <span className={styles.reqName}>{r.name}</span>
                      <button className={styles.deleteBtn} onClick={() => deleteGroceryRequest(r.id)}>✕</button>
                    </div>
                    {r.notes && <span className={styles.reqNotes}>"{r.notes}"</span>}
                    <span className={styles.reqBy} style={{ background: col.bg, color: col.dark }}>
                      {requester?.emoji} {requester?.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
