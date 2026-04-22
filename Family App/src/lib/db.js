import { supabase } from './supabase';

// Throw on Supabase errors so .catch() handlers actually fire
const check = (res) => { if (res.error) throw res.error; return res; };
const checked = (q) => q.then(check);

// ── Row ↔ App-state transforms ─────────────────────────

const choreFromRow = (r) => ({
  id: r.id, title: r.title, assignedTo: r.assigned_to,
  frequency: r.frequency, completed: r.completed, dueDate: r.due_date,
});
const choreToRow = (c) => ({
  id: c.id, title: c.title, assigned_to: c.assignedTo,
  frequency: c.frequency, completed: c.completed, due_date: c.dueDate,
});

// Normalize any time string to "HH:MM" for <input type="time">
// Handles: "17:30", "17:30:00", "5:30 PM", "6:15 AM", null
const normalizeTime = (t) => {
  if (!t) return t;
  const ampm = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2];
    const period = ampm[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  // Already 24-hour — just ensure HH:MM (trim seconds if present)
  return t.slice(0, 5);
};

const eventFromRow = (r) => ({
  id: r.id, title: r.title, memberId: r.member_id,
  date: r.date, time: normalizeTime(r.time), endTime: normalizeTime(r.end_time), color: r.color, transportParent: r.transport_parent,
});
const eventToRow = (e) => ({
  id: e.id, title: e.title, member_id: e.memberId,
  date: e.date, time: e.time, end_time: e.endTime, color: e.color, transport_parent: e.transportParent,
});

const recFromRow = (r) => ({
  id: r.id, title: r.title, category: r.category,
  suggestedBy: r.suggested_by, votes: r.votes ?? [],
});
const recToRow = (r) => ({
  id: r.id, title: r.title, category: r.category,
  suggested_by: r.suggestedBy, votes: r.votes ?? [],
});

const groceryFromRow = (r) => ({
  id: r.id, name: r.name, qty: r.qty,
  category: r.category, addedBy: r.added_by, checked: r.checked,
});
const groceryToRow = (g) => ({
  id: g.id, name: g.name, qty: g.qty,
  category: g.category, added_by: g.addedBy, checked: g.checked,
});

const reqFromRow = (r) => ({
  id: r.id, name: r.name, requestedBy: r.requested_by, notes: r.notes, status: r.status,
});
const reqToRow = (r) => ({
  id: r.id, name: r.name, requested_by: r.requestedBy, notes: r.notes, status: r.status,
});

// custody rows: [{date, parent}] → {date: parent}
const custodyFromRows = (rows) =>
  rows.reduce((acc, r) => ({ ...acc, [r.date]: r.parent }), {});

// mealPlan rows: [{date, slot, meal}] → {date: {slot: meal}}
const mealPlanFromRows = (rows) =>
  rows.reduce((acc, r) => ({
    ...acc, [r.date]: { ...(acc[r.date] || {}), [r.slot]: r.meal },
  }), {});

// ── Load all ───────────────────────────────────────────

export async function loadAll() {
  const [choresRes, eventsRes, custodyRes, mealPlanRes, mealRecsRes, groceriesRes, reqsRes] =
    await Promise.all([
      supabase.from('chores').select('*').order('created_at'),
      supabase.from('events').select('*').order('date'),
      supabase.from('custody').select('*'),
      supabase.from('meal_plan').select('*'),
      supabase.from('meal_recommendations').select('*').order('created_at'),
      supabase.from('groceries').select('*').order('created_at'),
      supabase.from('grocery_requests').select('*').order('created_at'),
    ]);

  return {
    chores:          (choresRes.data   ?? []).map(choreFromRow),
    events:          (eventsRes.data   ?? []).map(eventFromRow),
    custody:         custodyFromRows(custodyRes.data ?? []),
    mealPlan:        mealPlanFromRows(mealPlanRes.data ?? []),
    mealRecs:        (mealRecsRes.data ?? []).map(recFromRow),
    groceries:       (groceriesRes.data ?? []).map(groceryFromRow),
    groceryRequests: (reqsRes.data      ?? []).map(reqFromRow),
  };
}

// ── Chores ─────────────────────────────────────────────

export const dbAddChore    = (c) => checked(supabase.from('chores').insert(choreToRow(c)));
export const dbUpdateChore = (id, u) => checked(supabase.from('chores').update(choreToRow({ id, ...u })).eq('id', id));
export const dbDeleteChore = (id) => checked(supabase.from('chores').delete().eq('id', id));

// ── Events ─────────────────────────────────────────────

export const dbAddEvent    = (e) => checked(supabase.from('events').insert(eventToRow(e)));
export const dbUpdateEvent = (id, u) => checked(supabase.from('events').update(eventToRow({ id, ...u })).eq('id', id));
export const dbDeleteEvent = (id) => checked(supabase.from('events').delete().eq('id', id));

// ── Custody ────────────────────────────────────────────

export const dbSetCustody = (date, parent) =>
  parent
    ? checked(supabase.from('custody').upsert({ date, parent }))
    : checked(supabase.from('custody').delete().eq('date', date));

// ── Meal plan ──────────────────────────────────────────

export const dbSetMeal = (date, slot, meal) =>
  meal
    ? checked(supabase.from('meal_plan').upsert({ date, slot, meal }))
    : checked(supabase.from('meal_plan').delete().eq('date', date).eq('slot', slot));

// ── Meal recommendations ───────────────────────────────

export const dbAddMealRec    = (r) => checked(supabase.from('meal_recommendations').insert(recToRow(r)));
export const dbDeleteMealRec = (id) => checked(supabase.from('meal_recommendations').delete().eq('id', id));
export const dbVoteMealRec   = (id, votes) =>
  checked(supabase.from('meal_recommendations').update({ votes }).eq('id', id));

// ── Groceries ──────────────────────────────────────────

export const dbAddGrocery    = (g) => checked(supabase.from('groceries').insert(groceryToRow(g)));
export const dbToggleGrocery = (id, chk) => checked(supabase.from('groceries').update({ checked: chk }).eq('id', id));
export const dbDeleteGrocery = (id) => checked(supabase.from('groceries').delete().eq('id', id));

// ── Grocery requests ───────────────────────────────────

export const dbAddGroceryReq    = (r) => checked(supabase.from('grocery_requests').insert(reqToRow(r)));
export const dbUpdateGroceryReq = (id, u) => checked(supabase.from('grocery_requests').update(reqToRow({ id, ...u })).eq('id', id));
export const dbDeleteGroceryReq = (id) => checked(supabase.from('grocery_requests').delete().eq('id', id));
