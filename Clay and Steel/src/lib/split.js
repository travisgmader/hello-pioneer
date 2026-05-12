export const BODY_PART_ORDER = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms']
export const PPL_ORDER = ['Push', 'Pull', 'Legs']
export const VALID_LABELS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Push', 'Pull']
export const PT_LABELS = ['PT-Run', 'PT-Push', 'PT-Core', 'PT-Full']

export const SPLIT_OPTIONS = [
  { value: 'body-part', label: '5 Body Parts' },
  { value: 'ppl', label: 'Push / Pull / Legs' },
  { value: 'hybrid', label: 'Hybrid' },
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
