import { useState } from 'react'
import { SPLIT_OPTIONS, VALID_LABELS, FULL_BODY_LABELS, normalizeHybridDay, PHASE_META, daysOnSplit } from '../lib/split.js'
import { HYBRID_SEQUENCE, buildDefaultTemplates } from '../lib/defaults.js'
import {
  getTables, distributeScore, targetReps, targetRunSecs,
  formatTime, buildPTTemplates, ageKey, WAIST_BOUNDS, WEEK_PHASES,
  getHAMRTable, targetHAMRShuttles, hamrLevelDisplay,
} from '../lib/afpt.js'
import styles from './Split.module.css'

export default function Settings({ state, setState, setPage }) {
  const { settings } = state

  const setSplit = split => {
    setState(s => {
      const nextSettings = {
        ...s.settings,
        split,
        splitStartedAt: new Date().toISOString(),
        splitPhase: 0,
      }
      let nextTemplates = s.templates
      if (split === 'hybrid') {
        if (!(s.settings.hybridSequence?.length)) {
          nextSettings.hybridSequence = HYBRID_SEQUENCE
        }
        const hybridTemplates = buildDefaultTemplates('hybrid', undefined, 0)
        nextTemplates = { ...hybridTemplates, ...s.templates }
      }
      if (split === 'full-body') {
        const days = s.settings.fullBodyDays ?? 3
        nextSettings.fullBodyDays = days
        const fbTemplates = buildDefaultTemplates('full-body', days, 0)
        nextTemplates = { ...fbTemplates, ...s.templates }
      }
      return {
        ...s,
        settings: nextSettings,
        templates: nextTemplates,
        rotation: { pointer: 0 },
        session: null,
      }
    })
  }

  const setHybrid = hybridSequence => {
    setState(s => ({
      ...s,
      settings: { ...s.settings, hybridSequence },
      rotation: { pointer: 0 },
      session: null,
    }))
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Split</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Split</h2>
        <div className={styles.options}>
          {SPLIT_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`${styles.option} ${settings.split === opt.value ? styles.optionActive : ''}`}
            >
              <input
                type="radio"
                name="split"
                value={opt.value}
                checked={settings.split === opt.value}
                onChange={() => setSplit(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <button className={styles.createCustomBtn}>+ Create Custom</button>
        <p className={styles.note}>
          Changing the split resets the rotation pointer and clears any
          in-progress workout.
        </p>
      </section>

      {settings.split === 'full-body' && (
        <FullBodyConfig state={state} setState={setState} />
      )}

      {settings.split === 'hybrid' && (
        <HybridEditor sequence={settings.hybridSequence} onChange={setHybrid} />
      )}

      {settings.split === 'af-pt' && (
        <AFPTConfig state={state} setState={setState} setPage={setPage} />
      )}

      {settings.split !== 'af-pt' && (
        <PeriodizationSection state={state} setState={setState} />
      )}
    </div>
  )
}

const FULL_BODY_SCHEDULE_LABELS = {
  2: 'Mon / Thu',
  3: 'Mon / Wed / Fri',
  4: 'Mon / Tue / Thu / Fri',
}

function FullBodyConfig({ state, setState }) {
  const [days, setDays] = useState(state.settings?.fullBodyDays ?? 3)
  const [applied, setApplied] = useState(false)

  const apply = () => {
    const newTemplates = buildDefaultTemplates('full-body', days)
    setState(s => ({
      ...s,
      settings: { ...s.settings, fullBodyDays: days },
      templates: { ...s.templates, ...newTemplates },
      rotation: { pointer: 0 },
      session: null,
    }))
    setApplied(true)
    setTimeout(() => setApplied(false), 2200)
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Training Days</h2>
      <p className={styles.note}>
        All workouts use dumbbells, bodyweight, and a pull-up bar — no gym required.
      </p>
      <div className={styles.options} style={{ marginTop: 14 }}>
        {[2, 3, 4].map(d => (
          <label
            key={d}
            className={`${styles.option} ${days === d ? styles.optionActive : ''}`}
          >
            <input
              type="radio"
              name="fullBodyDays"
              value={d}
              checked={days === d}
              onChange={() => setDays(d)}
            />
            <span>{d} days — {FULL_BODY_SCHEDULE_LABELS[d]}</span>
          </label>
        ))}
      </div>
      <div className={styles.rotationRow} style={{ marginTop: 14 }}>
        <span className={styles.rotationLabel}>{days}-day rotation</span>
        <div className={styles.rotationDays}>
          {FULL_BODY_LABELS.slice(0, days).map(label => (
            <span key={label} className={styles.rotationDay}>{label}</span>
          ))}
        </div>
      </div>
      <button
        className={`${styles.generateBtn} ${applied ? styles.generateBtnDone : ''}`}
        onClick={apply}
      >
        {applied ? 'Templates Generated!' : 'Generate Templates'}
      </button>
    </section>
  )
}

function AFPTConfig({ state, setState, setPage }) {
  const profile = state.profile ?? {}
  const age     = parseInt(profile.age, 10)
  const sex     = profile.sex

  const hasProfile = Number.isFinite(age) && (sex === 'male' || sex === 'female')

  const savedGoal = state.settings?.ptGoal ?? 85
  const [targetScore, setTargetScore] = useState(savedGoal)
  const [cardioType, setCardioType]   = useState(state.settings?.cardioType ?? 'run')
  const [applied, setApplied] = useState(false)

  const ptWeek = state.settings?.ptWeek ?? 0

  const apply = () => {
    const newTemplates = buildPTTemplates(targetScore, sex, age, 1, cardioType)
    setState(s => ({
      ...s,
      settings: { ...s.settings, ptGoal: targetScore, ptWeek: 1, cardioType },
      templates: { ...s.templates, ...newTemplates },
    }))
    setApplied(true)
    setTimeout(() => setApplied(false), 2200)
  }

  const advanceWeek = () => {
    const nextWeek = Math.min(ptWeek + 1, 6)
    const newTemplates = buildPTTemplates(targetScore, sex, age, nextWeek, cardioType)
    setState(s => ({
      ...s,
      settings: { ...s.settings, ptWeek: nextWeek },
      templates: { ...s.templates, ...newTemplates },
    }))
  }

  let targets = null
  if (hasProfile) {
    const tables = getTables(sex, age)
    const { cardio, pushups: pushPts, core: corePts } = distributeScore(targetScore)
    const hamrTable = getHAMRTable(sex, age)
    targets = {
      cardio, pushPts, corePts,
      runSecs:       targetRunSecs(cardio, tables.run),
      hamrShuttles:  targetHAMRShuttles(cardio, hamrTable),
      hamrMin:       hamrTable.min,
      pushReps:      targetReps(pushPts, tables.pushup),
      situpReps:     targetReps(corePts, tables.situp),
      plankSecs:     targetReps(corePts, tables.plank),
      minRunSecs:    tables.run.minSecs,
      minPush:       tables.pushup.min,
      minSitup:      tables.situp.min,
      minPlank:      tables.plank.min,
    }
  }

  const waistThreshold = sex === 'female'
    ? WAIST_BOUNDS.female.low
    : WAIST_BOUNDS.male.low

  const phase = ptWeek > 0 ? WEEK_PHASES[ptWeek - 1] : null

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>AF PT Goal</h2>

      {!hasProfile && (
        <p className={styles.note}>
          Set your age and sex in{' '}
          {setPage
            ? <a className={styles.link} onClick={() => setPage('gear')}>Settings → Profile</a>
            : 'Settings → Profile'
          }{' '}
          to calculate your component targets.
        </p>
      )}

      {hasProfile && (
        <>
          <div className={styles.profileBadge}>
            {sex} · age {age} · {ageKey(age)} bracket
          </div>

          <label className={styles.ptField}>
            <span className={styles.ptLabel}>Target Score (75 – 100)</span>
            <input
              className={styles.ptInput}
              type="number"
              min="75"
              max="100"
              value={targetScore}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (v >= 75 && v <= 100) setTargetScore(v)
              }}
            />
          </label>

          <div className={styles.ptField}>
            <span className={styles.ptLabel}>Cardio Component</span>
            <div className={styles.cardioRow}>
              {[
                { value: 'run',  label: '2-Mile Run' },
                { value: 'hamr', label: 'HAMR Run' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`${styles.option} ${cardioType === opt.value ? styles.optionActive : ''}`}
                  style={{ flex: 1 }}
                >
                  <input
                    type="radio"
                    name="splitCardioType"
                    value={opt.value}
                    checked={cardioType === opt.value}
                    onChange={() => setCardioType(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.breakdown}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Body Composition</span>
              <span className={styles.breakdownTarget}>
                20 pts
                <span className={styles.breakdownMin}> WHtR ≤ {waistThreshold}</span>
              </span>
            </div>

            {cardioType === 'run' && (
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>2-Mile Run</span>
                <span className={styles.breakdownTarget}>
                  {targets.cardio} pts → {formatTime(targets.runSecs)}
                  <span className={styles.breakdownMin}> min: {formatTime(targets.minRunSecs)}</span>
                </span>
              </div>
            )}

            {cardioType === 'hamr' && (
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>HAMR Run</span>
                <span className={styles.breakdownTarget}>
                  {targets.cardio} pts → {hamrLevelDisplay(targets.hamrShuttles)}
                  <span className={styles.breakdownMin}> min: {hamrLevelDisplay(targets.hamrMin)}</span>
                </span>
              </div>
            )}

            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Push-Ups</span>
              <span className={styles.breakdownTarget}>
                {targets.pushPts} pts → {targets.pushReps} reps
                <span className={styles.breakdownMin}> min: {targets.minPush}</span>
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Core — Sit-Ups</span>
              <span className={styles.breakdownTarget}>
                {targets.corePts} pts → {targets.situpReps} reps
                <span className={styles.breakdownMin}> min: {targets.minSitup}</span>
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Core — Plank</span>
              <span className={styles.breakdownTarget}>
                {targets.corePts} pts → {targets.plankSecs}s
                <span className={styles.breakdownMin}> min: {targets.minPlank}s</span>
              </span>
            </div>
          </div>

          {phase && (
            <>
              <div className={styles.weekRow}>
                <span className={`${styles.weekBadge} ${phase.name === 'Peak' ? styles.weekBadgePeak : ''}`}>
                  Week {ptWeek} of 6 — {phase.name}
                </span>
                {ptWeek < 6 && (
                  <button className={styles.advanceBtn} onClick={advanceWeek}>
                    Advance to Week {ptWeek + 1} →
                  </button>
                )}
              </div>

              <div className={styles.weekTargets}>
                <div className={styles.weekTargetsTitle}>This week's training volumes</div>
                <div className={styles.breakdown}>
                  <div className={styles.breakdownRow}>
                    <span className={styles.breakdownLabel}>Run Intervals</span>
                    <span className={styles.breakdownTarget}>
                      {phase.intervals} × 400m
                      <span className={styles.breakdownMin}> @ {formatTime(Math.round(targets.runSecs * 0.1125))} each</span>
                    </span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span className={styles.breakdownLabel}>Push-Ups</span>
                    <span className={styles.breakdownTarget}>
                      4 sets × {Math.max(5, Math.round(targets.pushReps * phase.workFactor))} reps
                    </span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span className={styles.breakdownLabel}>Sit-Ups</span>
                    <span className={styles.breakdownTarget}>
                      3 sets × {Math.max(5, Math.round(targets.situpReps * phase.workFactor))} reps
                    </span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span className={styles.breakdownLabel}>Plank</span>
                    <span className={styles.breakdownTarget}>
                      3 sets × {Math.max(15, Math.round(targets.plankSecs * phase.workFactor))}s
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className={styles.rotationRow}>
            <span className={styles.rotationLabel}>5-day rotation</span>
            <div className={styles.rotationDays}>
              {['PT-Run', 'PT-Push', 'PT-Core', 'PT-Run', 'PT-Full'].map((day, i) => (
                <span key={i} className={styles.rotationDay}>{day}</span>
              ))}
            </div>
          </div>

          <button
            className={`${styles.generateBtn} ${applied ? styles.generateBtnDone : ''}`}
            onClick={apply}
          >
            {applied ? 'Templates Generated!' : ptWeek > 0 ? 'Restart Program (Week 1)' : 'Start 6-Week Program'}
          </button>
        </>
      )}
    </section>
  )
}

function PeriodizationSection({ state, setState }) {
  const { settings } = state
  const phase = settings.splitPhase ?? 0
  const meta  = PHASE_META[phase]
  const days  = daysOnSplit(settings)
  const [applied, setApplied] = useState(false)

  const advance = () => {
    const nextPhase  = Math.min(phase + 1, 2)
    const split      = settings.split
    const fullBodyDays = settings.fullBodyDays ?? 3
    const newTemplates = buildDefaultTemplates(split, fullBodyDays, nextPhase)
    setState(s => ({
      ...s,
      settings: { ...s.settings, splitPhase: nextPhase },
      templates: { ...s.templates, ...newTemplates },
    }))
  }

  const restart = () => {
    const split      = settings.split
    const fullBodyDays = settings.fullBodyDays ?? 3
    const newTemplates = buildDefaultTemplates(split, fullBodyDays, 0)
    setState(s => ({
      ...s,
      settings: {
        ...s.settings,
        splitPhase: 0,
        splitStartedAt: new Date().toISOString(),
      },
      templates: { ...s.templates, ...newTemplates },
    }))
    setApplied(true)
    setTimeout(() => setApplied(false), 2200)
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Periodization</h2>
      <p className={styles.note}>
        Advance your program every 4 weeks to keep progressive overload on track.
        Templates update automatically — any custom edits you've made are preserved.
      </p>

      <div className={styles.weekRow} style={{ marginTop: 14 }}>
        <span className={`${styles.weekBadge} ${phase === 2 ? styles.weekBadgePeak : ''}`}>
          Phase {phase + 1} of 3 — {meta.name}
        </span>
        {days !== null && (
          <span className={styles.breakdownMin} style={{ fontSize: '0.8rem' }}>
            Day {days} on this split
          </span>
        )}
      </div>

      <div className={styles.breakdown} style={{ marginTop: 10 }}>
        {PHASE_META.map((p, i) => (
          <div
            key={i}
            className={styles.breakdownRow}
            style={i === phase ? { borderColor: 'var(--accent-deep)' } : {}}
          >
            <span className={styles.breakdownLabel}>
              Phase {i + 1} — {p.name}
              {i === phase && ' ◀'}
            </span>
            <span className={styles.breakdownTarget} style={{ color: i === phase ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>
              {p.repRange}
            </span>
          </div>
        ))}
      </div>

      <p className={styles.note} style={{ marginBottom: 14 }}>
        {meta.description}
      </p>

      {phase < 2 ? (
        <button className={styles.advanceBtn} style={{ width: '100%', padding: '11px 24px' }} onClick={advance}>
          Advance to Phase {phase + 2} — {PHASE_META[phase + 1].name} →
        </button>
      ) : (
        <button
          className={`${styles.generateBtn} ${applied ? styles.generateBtnDone : ''}`}
          onClick={restart}
        >
          {applied ? 'Restarted!' : 'Restart from Phase 1 — Hypertrophy'}
        </button>
      )}
    </section>
  )
}

function HybridEditor({ sequence: rawSequence, onChange }) {
  const sequence = (rawSequence ?? []).map(normalizeHybridDay).filter(d => d.length > 0)
  const move = (i, delta) => {
    const next = sequence.slice()
    const j = i + delta
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const removeDay = i => onChange(sequence.filter((_, idx) => idx !== i))
  const addLabel = (i, label) => {
    const next = sequence.map((day, idx) =>
      idx === i ? [...day, label] : day
    )
    onChange(next)
  }
  const removeLabel = (i, labelIdx) => {
    const next = sequence
      .map((day, idx) =>
        idx === i ? day.filter((_, k) => k !== labelIdx) : day
      )
      .filter(day => day.length > 0)
    onChange(next)
  }
  const addDay = label => onChange([...sequence, [label]])

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Hybrid sequence</h2>
      <p className={styles.note}>
        Order matters — this is the rotation that the dashboard cycles through.
        Each day can hold multiple body parts; their templates are combined.
      </p>

      {sequence.length === 0 ? (
        <div className={styles.emptySeq}>No days yet. Add one below.</div>
      ) : (
        <ol className={styles.seqList}>
          {sequence.map((day, i) => (
            <li key={i} className={styles.seqItem}>
              <div className={styles.seqMain}>
                <div className={styles.seqRowTop}>
                  <span className={styles.seqIdx}>{i + 1}.</span>
                  <div className={styles.chips}>
                    {day.map((label, k) => (
                      <button
                        key={k}
                        className={styles.chip}
                        onClick={() => removeLabel(i, k)}
                        title="Remove from this day"
                      >
                        {label} <span className={styles.chipX}>×</span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.seqActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                    >↑</button>
                    <button
                      className={styles.iconBtn}
                      onClick={() => move(i, 1)}
                      disabled={i === sequence.length - 1}
                      aria-label="Move down"
                    >↓</button>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeDay(i)}
                    >Remove</button>
                  </div>
                </div>
                <div className={styles.seqRowAdd}>
                  <span className={styles.addLabelInline}>Add to this day:</span>
                  <div className={styles.addBtns}>
                    {VALID_LABELS.map(label => (
                      <button
                        key={label}
                        className={styles.addBtnSm}
                        onClick={() => addLabel(i, label)}
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.addRow}>
        <span className={styles.addLabel}>Add new day starting with:</span>
        <div className={styles.addBtns}>
          {VALID_LABELS.map(label => (
            <button
              key={label}
              className={styles.addBtn}
              onClick={() => addDay(label)}
            >
              + {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
