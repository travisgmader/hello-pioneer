const INCREMENT = 5

export function suggestWeight(exerciseName, history) {
  // Collect the last two history entries that have weight data for this exercise
  const entries = []
  for (let i = history.length - 1; i >= 0 && entries.length < 2; i--) {
    const entry = Object.values(history[i].sets ?? {}).find(s => s?.name === exerciseName)
    if (entry?.weight != null) entries.push(entry)
  }

  if (entries.length === 0) return null

  const [last, prev] = entries
  const lastAllGo = last.results?.every(r => r === 'go')

  if (lastAllGo) return last.weight + INCREMENT

  // Two back-to-back sessions with at least one no-go → reduce weight
  if (prev && !prev.results?.every(r => r === 'go')) return last.weight - INCREMENT

  return last.weight
}
