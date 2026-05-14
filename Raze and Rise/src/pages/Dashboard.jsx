import ExerciseCard from '../components/ExerciseCard/ExerciseCard.jsx'
import { currentDayLabels, dayKey, deriveDayOrder, PHASE_META } from '../lib/split.js'
import { suggestWeight } from '../lib/progress.js'
import { getPhraseForWorkout } from '../lib/phrases.js'
import styles from './Dashboard.module.css'

function roundToPlate(lbs) {
  return Math.round(lbs / 2.5) * 2.5
}

function buildCompositeTemplate(labels, templates) {
  const key = dayKey(labels)
  if (templates[key]) {
    return { dayKey: key, missing: [], exercises: templates[key].exercises }
  }
  const exercises = []
  const missing = []
  for (const l of labels) {
    const t = templates[l]
    if (!t) missing.push(l)
    else exercises.push(...t.exercises)
  }
  return { dayKey: key, missing, exercises }
}

function buildSession(composite, state) {
  const { history = [], exerciseOrm = {}, settings = {} } = state
  const isOrm = settings.weightMethod === 'orm'
  const sets = {}
  for (const ex of composite.exercises) {
    const orm = exerciseOrm[ex.name] ?? null
    const pct = 70
    const suggested = suggestWeight(ex.name, history)
    sets[ex.id] = {
      name: ex.name,
      pct,
      orm,
      weight: suggested !== null
        ? suggested
        : (isOrm && orm ? roundToPlate(orm * pct / 100) : null),
      results: Array(ex.sets).fill(null),
    }
  }
  return {
    dayLabel: composite.dayKey,
    startedAt: new Date().toISOString(),
    sets,
  }
}

function normalizeSetData(raw, ex) {
  if (!raw) return { name: ex.name, pct: 70, orm: null, weight: null, results: Array(ex.sets).fill(null) }
  if (Array.isArray(raw)) return { name: ex.name, pct: 70, orm: null, weight: null, results: raw }
  return { pct: 70, orm: null, ...raw }
}

function getOrInitSession(state, composite) {
  if (state.session?.dayLabel === composite.dayKey) return state.session
  return buildSession(composite, state)
}

export default function Dashboard({ state, setState, setPage }) {
  const labels = currentDayLabels(state)
  const order = deriveDayOrder(state.settings)
  const composite = labels.length ? buildCompositeTemplate(labels, state.templates) : null
  const weightMethod = state.settings?.weightMethod ?? 'manual'

  if (order.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h2>No split configured</h2>
          <p>
            Pick a split in <a onClick={() => setPage('settings')}>Settings</a> to
            get started.
          </p>
        </div>
      </div>
    )
  }

  const dayDisplay = dayKey(labels)

  if (!composite || composite.missing.length > 0 || composite.exercises.length === 0) {
    return (
      <div className={styles.page}>
        <Header dayDisplay={dayDisplay} order={order} pointer={state.rotation.pointer} settings={state.settings} />
        <div className={styles.empty}>
          <h2>
            {composite && composite.missing.length > 0
              ? `Missing template: ${composite.missing.join(', ')}`
              : `No template for ${dayDisplay}`}
          </h2>
          <p>
            Create {composite && composite.missing.length > 1 ? 'them' : 'one'} in{' '}
            <a onClick={() => setPage('workouts')}>Workouts</a>, or skip this day.
          </p>
          <button className={styles.skipBtn} onClick={() => skipDay(setState)}>
            Skip to next day
          </button>
        </div>
      </div>
    )
  }

  const session = getOrInitSession(state, composite)

  const getSetData = exerciseId => {
    const ex = composite.exercises.find(e => e.id === exerciseId)
    return normalizeSetData(session.sets[exerciseId], ex)
  }

  const withSession = updater =>
    setState(s => {
      const cur = s.session?.dayLabel === composite.dayKey
        ? s.session
        : buildSession(composite, s)
      return { ...s, session: updater(cur, s) }
    })

  const updateWeight = (exerciseId, weight) => {
    withSession(cur => {
      const existing = getSetData(exerciseId)
      return { ...cur, sets: { ...cur.sets, [exerciseId]: { ...existing, weight } } }
    })
  }

  const updateOrm = (exerciseId, orm) => {
    setState(s => {
      const cur = s.session?.dayLabel === composite.dayKey
        ? s.session
        : buildSession(composite, s)
      const existing = normalizeSetData(cur.sets[exerciseId], composite.exercises.find(e => e.id === exerciseId))
      const weight = orm && existing.pct ? roundToPlate(orm * existing.pct / 100) : existing.weight
      const exName = existing.name
      return {
        ...s,
        exerciseOrm: { ...s.exerciseOrm, [exName]: orm },
        session: {
          ...cur,
          sets: { ...cur.sets, [exerciseId]: { ...existing, orm, weight } },
        },
      }
    })
  }

  const updatePct = (exerciseId, pct) => {
    withSession((cur, s) => {
      const existing = normalizeSetData(cur.sets[exerciseId], composite.exercises.find(e => e.id === exerciseId))
      const orm = existing.orm ?? s.exerciseOrm?.[existing.name] ?? null
      const weight = orm ? roundToPlate(orm * pct / 100) : existing.weight
      return { ...cur, sets: { ...cur.sets, [exerciseId]: { ...existing, pct, weight } } }
    })
  }

  const markSet = (exerciseId, setIndex, value) => {
    withSession(cur => {
      const ex = composite.exercises.find(e => e.id === exerciseId)
      const existing = normalizeSetData(cur.sets[exerciseId], ex)
      const results = existing.results.slice()
      while (results.length <= setIndex) results.push(null)
      results[setIndex] = value
      return { ...cur, sets: { ...cur.sets, [exerciseId]: { ...existing, results } } }
    })
  }

  const completeWorkout = () => {
    setState(s => {
      const cur = s.session?.dayLabel === composite.dayKey
        ? s.session
        : buildSession(composite, s)
      const completed = {
        id: crypto.randomUUID(),
        dayLabel: cur.dayLabel,
        startedAt: cur.startedAt,
        completedAt: new Date().toISOString(),
        sets: cur.sets,
      }
      const ord = deriveDayOrder(s.settings)
      const nextPointer = ord.length === 0 ? 0 : (s.rotation.pointer + 1) % ord.length
      return { ...s, history: [...s.history, completed], session: null, rotation: { pointer: nextPointer } }
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.heroBanner}>
        <span className={styles.heroText}>{getPhraseForWorkout(state.history?.length ?? 0)}</span>
      </div>
      <Header dayDisplay={dayDisplay} order={order} pointer={state.rotation.pointer} settings={state.settings} />
      <div className={styles.cards}>
        {composite.exercises.map(ex => {
          const setData = getSetData(ex.id)
          return (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              weight={setData.weight}
              results={setData.results}
              weightMethod={weightMethod}
              orm={setData.orm ?? state.exerciseOrm?.[ex.name] ?? null}
              pct={setData.pct ?? 70}
              onWeightChange={w => updateWeight(ex.id, w)}
              onOrmChange={v => updateOrm(ex.id, v)}
              onPctChange={p => updatePct(ex.id, p)}
              onMark={(i, v) => markSet(ex.id, i, v)}
            />
          )
        })}
      </div>
      <button className={styles.completeBtn} onClick={completeWorkout}>
        Complete Workout
      </button>
    </div>
  )
}

function Header({ dayDisplay, order, pointer, settings }) {
  const split = settings?.split
  const phase = settings?.splitPhase ?? 0
  const phaseMeta = split !== 'af-pt' ? PHASE_META[phase] : null

  return (
    <div className={styles.header}>
      <div>
        <div className={styles.eyebrow}>Today</div>
        <h1 className={styles.dayTitle}>{dayDisplay}</h1>
        {phaseMeta && (
          <div className={styles.phasePill}>
            Phase {phase + 1} — {phaseMeta.name}
          </div>
        )}
      </div>
      <div className={styles.dots}>
        {order.map((labels, i) => (
          <span
            key={`${labels.join('+')}-${i}`}
            className={`${styles.dot} ${i === pointer % order.length ? styles.dotActive : ''}`}
            title={dayKey(labels)}
          />
        ))}
      </div>
    </div>
  )
}

function skipDay(setState) {
  setState(s => {
    const order = deriveDayOrder(s.settings)
    const nextPointer = order.length === 0 ? 0 : (s.rotation.pointer + 1) % order.length
    return { ...s, session: null, rotation: { pointer: nextPointer } }
  })
}
