export const MEMBERS = [
  { id: 'mom', name: 'Mom', color: 'pink', emoji: '👩' },
  { id: 'dad', name: 'Dad', color: 'blue', emoji: '👨' },
  { id: 'stella', name: 'Stella', color: 'lavender', emoji: '🌸' },
  { id: 'roman', name: 'Roman', color: 'mint', emoji: '🦕' },
  { id: 'layla', name: 'Layla', color: 'yellow', emoji: '🌻' },
];

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const INITIAL_CHORES = [
  { id: 'c1', title: 'Wash Dishes', assignedTo: 'mom', frequency: 'daily', completed: false, dueDate: fmt(today) },
  { id: 'c2', title: 'Vacuum Living Room', assignedTo: 'dad', frequency: 'weekly', completed: false, dueDate: fmt(addDays(today, 1)) },
  { id: 'c3', title: 'Take Out Trash', assignedTo: 'roman', frequency: 'weekly', completed: true, dueDate: fmt(today) },
  { id: 'c4', title: 'Clean Bathroom', assignedTo: 'stella', frequency: 'weekly', completed: false, dueDate: fmt(addDays(today, 2)) },
  { id: 'c5', title: 'Feed Pets', assignedTo: 'layla', frequency: 'daily', completed: false, dueDate: fmt(today) },
  { id: 'c6', title: 'Mow Lawn', assignedTo: 'dad', frequency: 'weekly', completed: false, dueDate: fmt(addDays(today, 3)) },
  { id: 'c7', title: 'Fold Laundry', assignedTo: 'mom', frequency: 'weekly', completed: false, dueDate: fmt(addDays(today, 1)) },
  { id: 'c8', title: 'Wipe Kitchen Counters', assignedTo: 'stella', frequency: 'daily', completed: true, dueDate: fmt(today) },
  { id: 'c9', title: 'Sweep Porch', assignedTo: 'roman', frequency: 'weekly', completed: false, dueDate: fmt(addDays(today, 4)) },
  { id: 'c10', title: 'Water Plants', assignedTo: 'layla', frequency: 'weekly', completed: false, dueDate: fmt(addDays(today, 2)) },
];

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner'];

export const INITIAL_MEAL_RECOMMENDATIONS = [
  { id: 'mr1', title: 'Spaghetti Bolognese', category: 'Dinner', suggestedBy: 'mom', votes: ['dad', 'stella'] },
  { id: 'mr2', title: 'Tacos', category: 'Dinner', suggestedBy: 'roman', votes: ['layla', 'mom', 'dad'] },
  { id: 'mr3', title: 'Pancakes', category: 'Breakfast', suggestedBy: 'layla', votes: ['stella', 'roman'] },
  { id: 'mr4', title: 'Caesar Salad', category: 'Lunch', suggestedBy: 'mom', votes: ['dad'] },
  { id: 'mr5', title: 'Grilled Chicken', category: 'Dinner', suggestedBy: 'dad', votes: ['mom'] },
  { id: 'mr6', title: 'Mac & Cheese', category: 'Dinner', suggestedBy: 'stella', votes: ['roman', 'layla'] },
  { id: 'mr7', title: 'Avocado Toast', category: 'Breakfast', suggestedBy: 'mom', votes: [] },
  { id: 'mr8', title: 'BLT Sandwiches', category: 'Lunch', suggestedBy: 'dad', votes: ['roman'] },
];

// mealPlan: { 'YYYY-MM-DD': { Breakfast: string, Lunch: string, Dinner: string } }
export const INITIAL_MEAL_PLAN = {};

export const INITIAL_GROCERIES = [
  { id: 'g1', name: 'Milk', qty: '1 gallon', category: 'Dairy', addedBy: 'mom', checked: false },
  { id: 'g2', name: 'Eggs', qty: '1 dozen', category: 'Dairy', addedBy: 'mom', checked: false },
  { id: 'g3', name: 'Chicken breast', qty: '2 lbs', category: 'Meat', addedBy: 'dad', checked: true },
  { id: 'g4', name: 'Apples', qty: '6', category: 'Produce', addedBy: 'layla', checked: false },
  { id: 'g5', name: 'Bread', qty: '1 loaf', category: 'Bakery', addedBy: 'mom', checked: false },
  { id: 'g6', name: 'Pasta', qty: '2 boxes', category: 'Pantry', addedBy: 'dad', checked: false },
];

export const INITIAL_GROCERY_REQUESTS = [
  { id: 'gr1', name: 'Gummy bears', requestedBy: 'roman', notes: 'The green kind!', status: 'pending' },
  { id: 'gr2', name: 'Chocolate ice cream', requestedBy: 'stella', notes: '', status: 'approved' },
  { id: 'gr3', name: 'Orange juice', requestedBy: 'layla', notes: 'No pulp please', status: 'pending' },
];

export const INITIAL_EVENTS = [
  { id: 'e1', title: 'Soccer Practice', memberId: 'roman', date: fmt(addDays(today, 1)), time: '16:00', color: 'mint' },
  { id: 'e2', title: 'Dance Class', memberId: 'stella', date: fmt(addDays(today, 2)), time: '15:30', color: 'lavender' },
  { id: 'e3', title: 'Doctor Appointment', memberId: 'layla', date: fmt(addDays(today, 3)), time: '10:00', color: 'yellow' },
  { id: 'e4', title: 'Work Meeting', memberId: 'dad', date: fmt(today), time: '09:00', color: 'blue' },
  { id: 'e5', title: 'Book Club', memberId: 'mom', date: fmt(addDays(today, 5)), time: '19:00', color: 'pink' },
  { id: 'e6', title: 'Family Dinner', memberId: null, date: fmt(addDays(today, 6)), time: '18:00', color: 'peach' },
  { id: 'e7', title: 'Piano Lesson', memberId: 'stella', date: fmt(addDays(today, 7)), time: '14:00', color: 'lavender' },
  { id: 'e8', title: 'Grocery Run', memberId: 'mom', date: fmt(addDays(today, 2)), time: '11:00', color: 'pink' },
  { id: 'e9', title: 'Baseball Game', memberId: 'roman', date: fmt(addDays(today, 8)), time: '13:00', color: 'mint' },
  { id: 'e10', title: 'Dentist', memberId: 'layla', date: fmt(addDays(today, 10)), time: '14:30', color: 'yellow' },
];
