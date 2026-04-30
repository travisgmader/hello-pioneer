import { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_CHORES, INITIAL_EVENTS, INITIAL_MEAL_PLAN, INITIAL_MEAL_RECOMMENDATIONS, INITIAL_GROCERIES, INITIAL_GROCERY_REQUESTS } from '../data/initialData';
import { isConfigured, supabase } from '../lib/supabase';
import { nextDueDate } from '../lib/utils';
import * as db from '../lib/db';

const AppContext = createContext(null);

// ── localStorage fallback helpers ─────────────────────
const lsLoad = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSave = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// ── Provider ──────────────────────────────────────────
export function AppProvider({ children }) {
  const [user, setUser]                     = useState(null);
  const [authLoading, setAuthLoading]       = useState(isConfigured);
  const [loading, setLoading]               = useState(isConfigured);
  const [dbError, setDbError]               = useState(null);
  const [chores, setChores]                 = useState(() => lsLoad('family_chores', INITIAL_CHORES));
  const [events, setEvents]                 = useState(() => lsLoad('family_events', INITIAL_EVENTS));
  const [custody, setCustody]               = useState(() => lsLoad('family_custody', {}));
  const [mealPlan, setMealPlan]             = useState(() => lsLoad('family_meal_plan', INITIAL_MEAL_PLAN));
  const [mealRecs, setMealRecs]             = useState(() => lsLoad('family_meal_recs', INITIAL_MEAL_RECOMMENDATIONS));
  const [groceries, setGroceries]           = useState(() => lsLoad('family_groceries', INITIAL_GROCERIES));
  const [groceryRequests, setGroceryRequests] = useState(() => lsLoad('family_grocery_requests', INITIAL_GROCERY_REQUESTS));

  // ── Auth state ───────────────────────────────────────
  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load from Supabase once auth is confirmed ─────────
  useEffect(() => {
    if (!isConfigured || authLoading) return;
    if (!user) { setLoading(false); return; }
    db.loadAll().then((data) => {
      setChores(data.chores);
      setEvents(data.events);
      setCustody(data.custody);
      setMealPlan(data.mealPlan);
      setMealRecs(data.mealRecs);
      setGroceries(data.groceries);
      setGroceryRequests(data.groceryRequests);
    }).catch(console.error).finally(() => setLoading(false));
  }, [authLoading, user]);

  // ── Real-time subscriptions ───────────────────────────
  useEffect(() => {
    if (!isConfigured || !user) return;
    const channel = supabase
      .channel('family-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chores' },           () => db.loadChores().then(setChores))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' },           () => db.loadEvents().then(setEvents))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custody' },          () => db.loadCustody().then(setCustody))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan' },        () => db.loadMealPlan().then(setMealPlan))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_recommendations' }, () => db.loadMealRecs().then(setMealRecs))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groceries' },        () => db.loadGroceries().then(setGroceries))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_requests' }, () => db.loadGroceryRequests().then(setGroceryRequests))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  // ── localStorage sync (only when Supabase is NOT configured) ──
  useEffect(() => { if (!isConfigured) lsSave('family_chores', chores); }, [chores]);
  useEffect(() => { if (!isConfigured) lsSave('family_events', events); }, [events]);
  useEffect(() => { if (!isConfigured) lsSave('family_custody', custody); }, [custody]);
  useEffect(() => { if (!isConfigured) lsSave('family_meal_plan', mealPlan); }, [mealPlan]);
  useEffect(() => { if (!isConfigured) lsSave('family_meal_recs', mealRecs); }, [mealRecs]);
  useEffect(() => { if (!isConfigured) lsSave('family_groceries', groceries); }, [groceries]);
  useEffect(() => { if (!isConfigured) lsSave('family_grocery_requests', groceryRequests); }, [groceryRequests]);

  const dbErr = (e) => { console.error('DB write error:', e); setDbError(e?.message || String(e)); };

  // ── Chores ────────────────────────────────────────────
  const addChore = (chore) => {
    const c = { ...chore, id: 'c' + Date.now(), completed: false };
    setChores(prev => [...prev, c]);
    if (isConfigured) db.dbAddChore(c).catch(dbErr);
  };
  const updateChore = (id, updates) => {
    setChores(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (isConfigured) db.dbUpdateChore(id, updates).catch(dbErr);
  };
  const deleteChore = (id) => {
    setChores(prev => prev.filter(c => c.id !== id));
    if (isConfigured) db.dbDeleteChore(id).catch(dbErr);
  };
  const toggleChore = (id) => {
    const chore = chores.find(c => c.id === id);
    if (!chore) return;
    const isRecurring = chore.frequency && chore.frequency !== 'once';
    if (!chore.completed && isRecurring) {
      // Show checkmark briefly, then advance to next cycle
      setChores(prev => prev.map(c => c.id === id ? { ...c, completed: true } : c));
      setTimeout(() => updateChore(id, { completed: false, dueDate: nextDueDate(chore.dueDate, chore.frequency) }), 900);
    } else {
      updateChore(id, { completed: !chore.completed });
    }
  };

  // ── Events ────────────────────────────────────────────
  const addEvent = (event) => {
    const e = { ...event, id: 'e' + Date.now() };
    setEvents(prev => [...prev, e]);
    if (isConfigured) db.dbAddEvent(e).catch(dbErr);
  };
  const updateEvent = (id, updates) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (isConfigured) db.dbUpdateEvent(id, updates).catch(dbErr);
  };
  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (isConfigured) db.dbDeleteEvent(id).catch(dbErr);
  };

  // ── Custody ───────────────────────────────────────────
  const setCustodyDay = (dateStr, parent) => {
    const next = custody[dateStr] === parent ? null : parent;
    setCustody(prev => ({ ...prev, [dateStr]: next }));
    if (isConfigured) db.dbSetCustody(dateStr, next).catch(dbErr);
  };

  // ── Meals ─────────────────────────────────────────────
  const setMeal = (dateStr, slot, value) => {
    setMealPlan(prev => ({ ...prev, [dateStr]: { ...prev[dateStr], [slot]: value } }));
    if (isConfigured) db.dbSetMeal(dateStr, slot, value).catch(dbErr);
  };
  const addMealRec = (rec) => {
    const r = { ...rec, id: 'mr' + Date.now(), votes: [] };
    setMealRecs(prev => [...prev, r]);
    if (isConfigured) db.dbAddMealRec(r).catch(dbErr);
  };
  const deleteMealRec = (id) => {
    setMealRecs(prev => prev.filter(r => r.id !== id));
    if (isConfigured) db.dbDeleteMealRec(id).catch(dbErr);
  };
  const voteMealRec = (id, memberId) => {
    let nextVotes;
    setMealRecs(prev => prev.map(r => {
      if (r.id !== id) return r;
      // Radio behavior: selecting a new emoji clears the previous pick; re-clicking deselects
      nextVotes = r.votes[0] === memberId ? [] : [memberId];
      return { ...r, votes: nextVotes };
    }));
    if (isConfigured) db.dbVoteMealRec(id, nextVotes).catch(dbErr);
  };

  // ── Groceries ─────────────────────────────────────────
  const addGrocery = (item) => {
    const g = { ...item, id: 'g' + Date.now(), checked: false };
    setGroceries(prev => [...prev, g]);
    if (isConfigured) db.dbAddGrocery(g).catch(dbErr);
  };
  const toggleGrocery = (id) => {
    const item = groceries.find(g => g.id === id);
    if (!item) return;
    setGroceries(prev => prev.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
    if (isConfigured) db.dbToggleGrocery(id, !item.checked).catch(dbErr);
  };
  const deleteGrocery = (id) => {
    setGroceries(prev => prev.filter(g => g.id !== id));
    if (isConfigured) db.dbDeleteGrocery(id).catch(dbErr);
  };

  // ── Grocery requests ──────────────────────────────────
  const addGroceryRequest = (req) => {
    const r = { ...req, id: 'gr' + Date.now(), status: 'pending' };
    setGroceryRequests(prev => [...prev, r]);
    if (isConfigured) db.dbAddGroceryReq(r).catch(dbErr);
  };
  const approveRequest = (id) => {
    const req = groceryRequests.find(r => r.id === id);
    if (!req) return;
    addGrocery({ name: req.name, qty: '', category: 'Requested', addedBy: req.requestedBy });
    setGroceryRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    if (isConfigured) db.dbUpdateGroceryReq(id, { ...req, status: 'approved' }).catch(dbErr);
  };
  const deleteGroceryRequest = (id) => {
    setGroceryRequests(prev => prev.filter(r => r.id !== id));
    if (isConfigured) db.dbDeleteGroceryReq(id).catch(dbErr);
  };

  const signOut = () => isConfigured ? supabase.auth.signOut() : null;

  return (
    <AppContext.Provider value={{
      user, authLoading, signOut,
      loading,
      chores, events, custody, mealPlan, mealRecs, groceries, groceryRequests,
      addChore, updateChore, deleteChore, toggleChore,
      addEvent, updateEvent, deleteEvent,
      setCustodyDay,
      setMeal, addMealRec, deleteMealRec, voteMealRec,
      addGrocery, toggleGrocery, deleteGrocery,
      addGroceryRequest, approveRequest, deleteGroceryRequest,
    }}>
      {dbError && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: 'white', padding: '10px 18px', borderRadius: 8, zIndex: 9999, fontSize: 13, maxWidth: 480, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>Save failed: {dbError}</span>
          <button onClick={() => setDbError(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
