import { useState } from 'react'
import { SPLIT_OPTIONS } from '../../lib/split.js'
import { buildDefaultTemplates, HYBRID_SEQUENCE } from '../../lib/defaults.js'
import {
  getTables, distributeScore, targetReps, targetRunSecs,
  formatTime, buildPTTemplates, ageKey, WAIST_BOUNDS,
  getHAMRTable, targetHAMRShuttles, hamrLevelDisplay,
} from '../../lib/afpt.js'
import styles from './Onboarding.module.css'

export default function Onboarding({ setState }) {
  const [step, setStep]         = useState(1)
  const [split, setSplit]       = useState('ppl')
  const [weightMethod, setWeightMethod] = useState('manual')
  const [age, setAge]           = useState('')
  const [sex, setSex]           = useState('')
  const [targetScore, setTargetScore] = useState(85)
  const [cardioType, setCardioType]   = useState('run')

  const isAfPt     = split === 'af-pt'
  const totalSteps = isAfPt ? 3 : 2

  const finish = () => {
    if (isAfPt) {
      const ageNum      = parseInt(age, 10)
      const newTemplates = buildPTTemplates(targetScore, sex, ageNum, 1, cardioType)
      setState(s => ({
        ...s,
        onboarded: true,
        settings: {
          ...s.settings,
          split: 'af-pt',
          weightMethod: 'manual',
          ptGoal: targetScore,
          ptWeek: 1,
          cardioType,
        },
        profile: { ...s.profile, age: String(ageNum), sex },
        templates: newTemplates,
        rotation: { pointer: 0 },
        session: null,
      }))
    } else {
      const seedTemplates = buildDefaultTemplates(split)
      setState(s => ({
        ...s,
        onboarded: true,
        settings: {
          ...s.settings,
          split,
          weightMethod,
          ...(split === 'hybrid' ? { hybridSequence: HYBRID_SEQUENCE } : {}),
        },
        templates: Object.keys(s.templates).length === 0 ? seedTemplates : s.templates,
        rotation: { pointer: 0 },
        session: null,
      }))
    }
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <p className={styles.firstTimeLabel}>First-time setup — you'll only see this once</p>
        <StepDots total={totalSteps} current={step} />

        {step === 1 && (
          <StepSplit split={split} setSplit={setSplit} onNext={() => setStep(2)} />
        )}

        {step === 2 && !isAfPt && (
          <StepWeightMethod
            weightMethod={weightMethod}
            setWeightMethod={setWeightMethod}
            onBack={() => setStep(1)}
            onFinish={finish}
          />
        )}

        {step === 2 && isAfPt && (
          <StepProfile
            age={age} setAge={setAge}
            sex={sex} setSex={setSex}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && isAfPt && (
          <StepPTGoal
            age={parseInt(age, 10)}
            sex={sex}
            targetScore={targetScore}
            setTargetScore={setTargetScore}
            cardioType={cardioType}
            setCardioType={setCardioType}
            onBack={() => setStep(2)}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  )
}

function StepDots({ total, current }) {
  const items = []
  for (let i = 0; i < total; i++) {
    if (i > 0) items.push(<span key={`line-${i}`} className={styles.dotLine} />)
    items.push(
      <span key={`dot-${i}`} className={`${styles.dot} ${current > i ? styles.dotActive : ''}`} />
    )
  }
  return <div className={styles.steps}>{items}</div>
}

function StepSplit({ split, setSplit, onNext }) {
  return (
    <>
      <h2 className={styles.heading}>Choose your training split</h2>
      <p className={styles.sub}>You can change this at any time in the Split tab.</p>
      <div className={styles.options}>
        {SPLIT_OPTIONS.map(opt => (
          <label
            key={opt.value}
            className={`${styles.option} ${split === opt.value ? styles.optionActive : ''}`}
          >
            <input
              type="radio"
              name="split"
              value={opt.value}
              checked={split === opt.value}
              onChange={() => setSplit(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <button className={styles.primary} onClick={onNext}>Continue</button>
    </>
  )
}

function StepProfile({ age, setAge, sex, setSex, onBack, onNext }) {
  const ageNum   = parseInt(age, 10)
  const validAge = Number.isFinite(ageNum) && ageNum >= 17 && ageNum <= 80
  const canNext  = validAge && (sex === 'male' || sex === 'female')

  return (
    <>
      <h2 className={styles.heading}>Your profile</h2>
      <p className={styles.sub}>Age and sex determine your AF PT scoring bracket and component targets.</p>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Age</span>
        <input
          className={styles.fieldInput}
          type="number"
          min="17"
          max="80"
          placeholder="e.g. 28"
          value={age}
          onChange={e => setAge(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Sex</span>
        <div className={styles.sexRow}>
          {['male', 'female'].map(s => (
            <label
              key={s}
              className={`${styles.option} ${sex === s ? styles.optionActive : ''}`}
              style={{ flex: 1 }}
            >
              <input
                type="radio"
                name="sex"
                value={s}
                checked={sex === s}
                onChange={() => setSex(s)}
              />
              <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.ghost} onClick={onBack}>← Back</button>
        <button className={styles.primary} onClick={onNext} disabled={!canNext} style={{ flex: 1 }}>
          Continue
        </button>
      </div>
    </>
  )
}

function StepPTGoal({ age, sex, targetScore, setTargetScore, cardioType, setCardioType, onBack, onFinish }) {
  const tables   = getTables(sex, age)
  const { cardio, pushups: pushPts, core: corePts } = distributeScore(targetScore)
  const pushReps  = targetReps(pushPts, tables.pushup)
  const situpReps = targetReps(corePts, tables.situp)
  const plankSecs = targetReps(corePts, tables.plank)
  const waistThreshold = sex === 'female' ? WAIST_BOUNDS.female.low : WAIST_BOUNDS.male.low

  const runSecs     = cardioType === 'run'
    ? targetRunSecs(cardio, tables.run)
    : null
  const hamrShuttles = cardioType === 'hamr'
    ? targetHAMRShuttles(cardio, getHAMRTable(sex, age))
    : null

  return (
    <>
      <h2 className={styles.heading}>PT goal score</h2>
      <p className={styles.sub}>Set your target composite and we'll build a 6-week program around it.</p>

      <div className={styles.ptBadge}>
        {sex} · age {age} · {ageKey(age)} bracket
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Target Score (75 – 100)</span>
        <input
          className={styles.fieldInput}
          type="number"
          min="75"
          max="100"
          value={targetScore}
          onChange={e => {
            const v = parseInt(e.target.value, 10)
            if (v >= 75 && v <= 100) setTargetScore(v)
          }}
          style={{ width: 100 }}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Cardio Component</span>
        <div className={styles.sexRow}>
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
                name="cardioType"
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
          <span className={styles.breakdownTarget}>20 pts
            <span className={styles.breakdownMin}> WHtR ≤ {waistThreshold}</span>
          </span>
        </div>

        {cardioType === 'run' && (
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>2-Mile Run</span>
            <span className={styles.breakdownTarget}>{cardio} pts → {formatTime(runSecs)}
              <span className={styles.breakdownMin}> min: {formatTime(tables.run.minSecs)}</span>
            </span>
          </div>
        )}

        {cardioType === 'hamr' && (
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>HAMR Run</span>
            <span className={styles.breakdownTarget}>{cardio} pts → {hamrLevelDisplay(hamrShuttles)}
              <span className={styles.breakdownMin}> min: {hamrLevelDisplay(getHAMRTable(sex, age).min)}</span>
            </span>
          </div>
        )}

        <div className={styles.breakdownRow}>
          <span className={styles.breakdownLabel}>Push-Ups</span>
          <span className={styles.breakdownTarget}>{pushPts} pts → {pushReps} reps
            <span className={styles.breakdownMin}> min: {tables.pushup.min}</span>
          </span>
        </div>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownLabel}>Core — Sit-Ups</span>
          <span className={styles.breakdownTarget}>{corePts} pts → {situpReps} reps
            <span className={styles.breakdownMin}> min: {tables.situp.min}</span>
          </span>
        </div>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownLabel}>Core — Plank</span>
          <span className={styles.breakdownTarget}>{corePts} pts → {plankSecs}s
            <span className={styles.breakdownMin}> min: {tables.plank.min}s</span>
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.ghost} onClick={onBack}>← Back</button>
        <button className={styles.primary} onClick={onFinish} style={{ flex: 1 }}>
          Generate Program
        </button>
      </div>
    </>
  )
}

function StepWeightMethod({ weightMethod, setWeightMethod, onBack, onFinish }) {
  return (
    <>
      <h2 className={styles.heading}>How do you want to start each lift?</h2>
      <p className={styles.sub}>This controls how working weights are set when you begin a workout.</p>
      <div className={styles.methodCards}>
        <button
          className={`${styles.methodCard} ${weightMethod === 'orm' ? styles.methodCardActive : ''}`}
          onClick={() => setWeightMethod('orm')}
        >
          <span className={styles.methodTitle}>1-Rep Max Percentages</span>
          <span className={styles.methodDesc}>Enter your 1RM for each exercise and the program calculates your working weight automatically.</span>
        </button>
        <button
          className={`${styles.methodCard} ${weightMethod === 'manual' ? styles.methodCardActive : ''}`}
          onClick={() => setWeightMethod('manual')}
        >
          <span className={styles.methodTitle}>Choose My Own Weight</span>
          <span className={styles.methodDesc}>You decide your starting weight each session. The program tracks progress and suggests adjustments.</span>
        </button>
      </div>
      <div className={styles.footer}>
        <button className={styles.ghost} onClick={onBack}>← Back</button>
        <button className={styles.primary} onClick={onFinish} style={{ flex: 1 }}>Finish</button>
      </div>
    </>
  )
}
