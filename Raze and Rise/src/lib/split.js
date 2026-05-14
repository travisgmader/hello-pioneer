export const BODY_PART_ORDER = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms']
export const PPL_ORDER = ['Push', 'Pull', 'Legs']
export const VALID_LABELS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Push', 'Pull']
export const PT_LABELS = ['PT-Run', 'PT-Push', 'PT-Core', 'PT-Full']
export const FULL_BODY_LABELS = ['Full-A', 'Full-B', 'Full-C', 'Full-D']

export const PHASE_META = [
  {
    name: 'Hypertrophy',
    repRange: '8–15 reps',
    description: 'Building muscle with moderate loads and higher rep volume.',
  },
  {
    name: 'Strength',
    repRange: '4–8 reps',
    description: 'Heavier compound focus with lower reps to build maximal strength.',
  },
  {
    name: 'Power',
    repRange: '2–5 reps',
    description: 'Peak intensity with the heaviest compound movements.',
  },
]

export function daysOnSplit(settings) {
  if (!settings?.splitStartedAt) return null
  return Math.floor((Date.now() - new Date(settings.splitStartedAt)) / (1000 * 60 * 60 * 24))
}

export const SPLIT_OPTIONS = [
  { value: 'body-part', label: '5 Body Parts' },
  { value: 'ppl', label: 'Push / Pull / Legs' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'full-body', label: 'Full Body' },
  { value: 'af-pt', label: 'AF PT Prep' },
]

export function normalizeHybridDay(day) {
  if (Array.isArray(day)) return day.filter(Boolean)
  if (typeof day === 'string' && day) return [day]
  return []
}

export function deriveDayOrder(settings) {
  if (settings.split === 'body-part') return BODY_PART_ORDER.map(l => [l])
  if (settings.split === 'ppl') return PPL_ORDER.map(l => [l])
  if (settings.split === 'af-pt') return [['PT-Run'], ['PT-Push'], ['PT-Core'], ['PT-Run'], ['PT-Full']]
  if (settings.split === 'full-body') {
    const days = settings.fullBodyDays ?? 3
    return FULL_BODY_LABELS.slice(0, days).map(l => [l])
  }
  return (settings.hybridSequence ?? [])
    .map(normalizeHybridDay)
    .filter(d => d.length > 0)
}

export function currentDayLabels(state) {
  const order = deriveDayOrder(state.settings)
  if (order.length === 0) return []
  return order[state.rotation.pointer % order.length]
}

export function dayKey(labels) {
  return labels.join(' + ')
}

export function advanceRotation(rotation, settings) {
  const order = deriveDayOrder(settings)
  if (order.length === 0) return { pointer: 0 }
  return { pointer: (rotation.pointer + 1) % order.length }
}
