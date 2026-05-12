import { useState } from 'react'
import { VALID_LABELS } from '../lib/split.js'
import { validateTemplate } from '../lib/upload.js'
import { DEFAULTS } from '../lib/defaults.js'
import styles from './Workouts.module.css'

// Always 5 for a single label, 6 split evenly across multiple labels.
// Each exercise carries _source so toggling a label off removes its exercises.
const computeDefaultExercises = labels => {
  const sorted = VALID_LABELS.filter(l => labels.includes(l))
  if (sorted.length === 0) return []
  const target = sorted.length === 1 ? 5 : 6
  const base = Math.floor(target / sorted.length)
  const extra = target % sorted.length
  const out = []
  sorted.forEach((label, i) => {
    const count = base + (i < extra ? 1 : 0)
    ;(DEFAULTS[label] ?? []).slice(0, count).forEach(ex =>
      out.push({ ...ex, key: crypto.randomUUID(), _source: label })
    )
  })
  return out
}

const emptyExercise = () => ({
  key: crypto.randomUUID(),
  name: '',
  sets: 3,
  repLow: 8,
  repHigh: 12,
  _source: 'custom',
})

// Always produce labels in VALID_LABELS order so the compound key is consistent
const computeDayLabel = labels =>
  VALID_LABELS.filter(l => labels.includes(l)).join(' + ')

export default function Workouts({ state, setState, isAdmin }) {
  const [creating, setCreating] = useState(false)
  const [editingLabel, setEditingLabel] = useState(null) // dayLabel being edited
  const [draft, setDraft] = useState({ labels: [], exercises: [] })
  const [error, setError] = useState(null)

  const templates = Object.values(state.templates).sort((a, b) =>
    a.dayLabel.localeCompare(b.dayLabel)
  )

  const openBuilder = () => {
    setDraft({ labels: [], exercises: [] })
    setEditingLabel(null)
    setError(null)
    setCreating(true)
  }

  const openEditor = template => {
    const labels = template.dayLabel.split(' + ').filter(l => VALID_LABELS.includes(l))
    setDraft({
      labels,
      exercises: template.exercises.map(ex => ({
        ...ex,
        key: ex.id,
        _source: ex._source ?? labels[0] ?? 'custom',
      })),
    })
    setEditingLabel(template.dayLabel)
    setError(null)
    setCreating(true)
  }

  const toggleLabel = label => {
    setDraft(d => {
      const isOn = d.labels.includes(label)
      const newLabels = isOn ? d.labels.filter(l => l !== label) : [...d.labels, label]
      const custom = d.exercises.filter(ex => ex._source === 'custom')
      const newDefaults = computeDefaultExercises(newLabels)
      return { labels: newLabels, exercises: [...newDefaults, ...custom] }
    })
  }

  const updateExercise = (key, field, value) =>
    setDraft(d => ({
      ...d,
      exercises: d.exercises.map(ex =>
        ex.key === key ? { ...ex, [field]: value } : ex
      ),
    }))

  const removeExercise = key =>
    setDraft(d => ({ ...d, exercises: d.exercises.filter(ex => ex.key !== key) }))

  const addExercise = () =>
    setDraft(d => ({ ...d, exercises: [...d.exercises, emptyExercise()] }))

  const onSave = () => {
    setError(null)
    if (draft.labels.length === 0) { setError('Select at least one day type.'); return }
    if (draft.exercises.length === 0) { setError('Add at least one exercise.'); return }
    try {
      const template = validateTemplate({
        dayLabel: computeDayLabel(draft.labels),
        exercises: draft.exercises.map(ex => ({
          name: ex.name.trim(),
          sets: Number(ex.sets),
          repLow: Number(ex.repLow),
          repHigh: Number(ex.repHigh),
        })),
      })
      setState(s => {
        const next = { ...s.templates }
        if (editingLabel && editingLabel !== template.dayLabel) delete next[editingLabel]
        next[template.dayLabel] = template
        return { ...s, templates: next }
      })
      setCreating(false)
      setEditingLabel(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const onDelete = dayLabel => {
    setState(s => {
      const next = { ...s.templates }
      delete next[dayLabel]
      const sessionCleared =
        s.session?.dayLabel === dayLabel ? null : s.session
      return { ...s, templates: next, session: sessionCleared }
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Workouts</h1>
        {!creating && (
          <button className={styles.createBtn} onClick={openBuilder}>
            + New Workout
          </button>
        )}
      </div>

      {creating && (
        <div className={styles.builder}>
          <h2 className={styles.builderTitle}>New Workout</h2>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Day type</div>
            <div className={styles.labelToggles}>
              {VALID_LABELS.map(l => (
                <button
                  key={l}
                  className={`${styles.labelToggle} ${draft.labels.includes(l) ? styles.labelToggleActive : ''}`}
                  onClick={() => toggleLabel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
            {draft.labels.length > 1 && (
              <div className={styles.combinedLabel}>
                {computeDayLabel(draft.labels)}
              </div>
            )}
          </div>

          {draft.exercises.length > 0 && (
            <div className={styles.builderExList}>
              <div className={styles.builderExHeader}>
                <span>Exercise</span>
                <span>Sets</span>
                <span>Rep range</span>
                <span />
              </div>
              {draft.exercises.map(ex => (
                <div key={ex.key} className={styles.builderExRow}>
                  <input
                    className={styles.exNameInput}
                    value={ex.name}
                    placeholder="Exercise name"
                    onChange={e => updateExercise(ex.key, 'name', e.target.value)}
                  />
                  <input
                    className={styles.exNumInput}
                    type="number"
                    min={1}
                    max={10}
                    value={ex.sets}
                    onChange={e => updateExercise(ex.key, 'sets', e.target.value)}
                  />
                  <div className={styles.repRange}>
                    <input
                      className={styles.exNumInput}
                      type="number"
                      min={1}
                      value={ex.repLow}
                      onChange={e => updateExercise(ex.key, 'repLow', e.target.value)}
                    />
                    <span className={styles.repDash}>–</span>
                    <input
                      className={styles.exNumInput}
                      type="number"
                      min={1}
                      value={ex.repHigh}
                      onChange={e => updateExercise(ex.key, 'repHigh', e.target.value)}
                    />
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeExercise(ex.key)}
                    aria-label="Remove exercise"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {draft.labels.length > 0 && draft.exercises.length < 6 && (
            <button className={styles.addExBtn} onClick={addExercise}>
              + Add exercise
            </button>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.builderActions}>
            <button className={styles.cancelBtn} onClick={() => { setCreating(false); setEditingLabel(null) }}>
              Cancel
            </button>
            <button className={styles.saveBtn} onClick={onSave}>
              {editingLabel ? 'Save Changes' : 'Save Workout'}
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 && !creating ? (
        <div className={styles.empty}>
          <h3>No workouts yet</h3>
          <p>Create your first one to get started.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {templates.map(t => (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.dayLabel}>{t.dayLabel}</h3>
                <div className={styles.cardActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => openEditor(t)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => onDelete(t.dayLabel)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <ul className={styles.exerciseList}>
                {t.exercises.map(ex => (
                  <li key={ex.id} className={styles.exerciseRow}>
                    <span className={styles.exName}>{ex.name}</span>
                    <span className={styles.exMeta}>
                      {ex.sets} × {ex.repLow}–{ex.repHigh}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
