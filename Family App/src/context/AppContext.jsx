import { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_CHORES, INITIAL_EVENTS, INITIAL_MEAL_PLAN, INITIAL_MEAL_RECOMMENDATIONS, INITIAL_GROCERIES, INITIAL_GROCERY_REQUESTS } from '../data/initialData';
import { isConfigured, supabase } from '../lib/supabase';
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

  // ── Load from Supabase on mount ──────────────────────
  useEffect(() => {
    if (!isConfigured) return;
    db.loadAll().then((data) => {
      setChores(data.chores);
      setEvents(data.events);
      setCustody(data.custody);
      setMealPlan(data.mealPlan);
      setMealRecs(data.mealRecs);
      setGroceries(data.groceries);
      setGroceryRequests(data.groceryRequests);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // ── localStorage sync (only when Supabase is NOT configured) ──
  useEffect(() => { if (!isConfigured) lsSave('family_chores', chores); }, [chores]);
  useEffect(() => { if (!isConfigured) lsSave('family_events', events); }, [events]);
  useEffect(() => { if (!isConfigured) lsSave('family_custody', custody); }, [custody]);
  useEffect(() => { if (!isConfigured) lsSave('family_meal_plan', mealPlan); }, [mealPlan]);
  useEffect(() => { if (!isConfigured) lsSave('family_meal_recs', mealRecs); }, [mealRecs]);
  useEffect(() => { if (!isConfigured) lsSave('family_groceries', groceries); }, [groceries]);
  useEffect(() => { if (!isConfigured) lsSave('family_grocery_requests', groceryRequests); }, [groceryRequests]);

  // ── Optimistic helper: update state + fire DB call ───
  const sync = (setter, dbCall) => (optimisticVal) => {
    setter(optimisticVal);
    if (isConfigured) dbCall().catch(console.error);
  };

  // ── Chores ────────────────────────────────────────────
  const addChore = (chore) => {
    const c = { ...chore, id: 'c' + Date.now(), completed: false };
    setChores(prev => [...prev, c]);
    if (isConfigured) db.dbAddChore(c).catch(console.error);
  };
  const updateChore = (id, updates) => {
    setChores(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (isConfigured) db.dbUpdateChore(id, updates).catch(console.error);
  };
  const deleteChore = (id) => {
    setChores(prev => prev.filter(c => c.id !== id));
    if (isConfigured) db.dbDeleteChore(id).catch(console.error);
  };
  const toggleChore = (id) => {
    const chore = chores.find(c => c.id === id);
    if (chore) updateChore(id, { completed: !chore.completed });
  };

  // ── Events ────────────────────────────────────────────
  const addEvent = (event) => {
    const e = { ...event, id: 'e' + Date.now() };
    setEvents(prev => [...prev, e]);
    if (isConfigured) db.dbAddEvent(e).catch(console.error);
  };
  const updateEvent = (id, updates) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (isConfigured) db.dbUpdateEvent(id, updates).catch(console.error);
  };
  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (isConfigured) db.dbDeleteEvent(id).catch(console.error);
  };

  // ── Custody ───────────────────────────────────────────
  const setCustodyDay = (dateStr, parent) => {
    const next = custody[dateStr] === parent ? null : parent;
    setCustody(prev => ({ ...prev, [dateStr]: next }));
    if (isConfigured) db.dbSetCustody(dateStr, next).catch(console.error);
  };

  // ── Meals ─────────────────────────────────────────────
  const setMeal = (dateStr, slot, value) => {
    setMealPlan(prev => ({ ...prev, [dateStr]: { ...prev[dateStr], [slot]: value } }));
    if (isConfigured) db.dbSetMeal(dateStr, slot, value).catch(console.error);
  };
  const addMealRec = (rec) => {
    const r = { ...rec, id: 'mr' + Date.now(), votes: [] };
    setMealRecs(prev => [...prev, r]);
    if (isConfigured) db.dbAddMealRec(r).catch(console.error);
  };
  const deleteMealRec = (id) => {
    setMealRecs(prev => prev.filter(r => r.id !== id));
    if (isConfigured) db.dbDeleteMealRec(id).catch(console.error);
  };
  const voteMealRec = (id, memberId) => {
    let nextVotes;
    setMealRecs(prev => prev.map(r => {
      if (r.id !== id) return r;
      const hasVoted = r.votes.includes(memberId);
      nextVotes = hasVoted ? r.votes.filter(v => v !== memberId) : [...r.votes, memberId];
      return { ...r, votes: nextVotes };
    }));
    if (isConfigured) db.dbVoteMealRec(id, nextVotes).catch(console.error);
  };

  // ── Groceries ─────────────────────────────────────────
  const addGrocery = (item) => {
    const g = { ...item, id: 'g' + Date.now(), checked: false };
    setGroceries(prev => [...prev, g]);
    if (isConfigured) db.dbAddGrocery(g).catch(console.error);
  };
  const toggleGrocery = (id) => {
    const item = groceries.find(g => g.id === id);
    if (!item) return;
    setGroceries(prev => prev.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
    if (isConfigured) db.dbToggleGrocery(id, !item.checked).catch(console.error);
  };
  const deleteGrocery = (id) => {
    setGroceries(prev => prev.filter(g => g.id !== id));
    if (isConfigured) db.dbDeleteGrocery(id).catch(console.error);
  };

  // ── Grocery requests ──────────────────────────────────
  const addGroceryRequest = (req) => {
    const r = { ...req, id: 'gr' + Date.now(), status: 'pending' };
    setGroceryRequests(prev => [...prev, r]);
    if (isConfigured) db.dbAddGroceryReq(r).catch(console.error);
  };
  const approveRequest = (id) => {
    const req = groceryRequests.find(r => r.id === id);
    if (!req) return;
    addGrocery({ name: req.name, qty: '', category: 'Requested', addedBy: req.requestedBy });
    setGroceryRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    if (isConfigured) db.dbUpdateGroceryReq(id, { ...req, status: 'approved' }).catch(console.error);
  };
  const deleteGroceryRequest = (id) => {
    setGroceryRequests(prev => prev.filter(r => r.id !== id));
    if (isConfigured) db.dbDeleteGroceryReq(id).catch(console.error);
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
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
