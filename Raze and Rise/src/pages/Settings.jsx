import { useState } from 'react'
import styles from './Settings.module.css'
import AdminPanel from './AdminPanel.jsx'
import { calculateMacros, GOALS, ACTIVITY_LEVELS } from '../lib/macros.js'

export default function Settings({ state, setState, isAdmin }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <ProfileSection state={state} setState={setState} />
      <MeasurementsSection state={state} setState={setState} />
      <OneRepMaxSection state={state} setState={setState} />
      <MacrosSection state={state} setState={setState} />
      {isAdmin && <AdminPanel />}
    </div>
  )
}

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <section className={styles.section}>
      <button
        className={styles.sectionHeader}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <h2 className={styles.sectionTitle}>{title}</h2>
        <span className={`${styles.chevron} ${open ? '' : styles.chevronCollapsed}`} />
      </button>
      <div className={`${styles.collapseBody} ${open ? '' : styles.collapseBodyClosed}`}>
        <div className={styles.collapseInner}>{children}</div>
      </div>
    </section>
  )
}

function ProfileSection({ state, setState }) {
  const src = state.profile ?? {}
  const [form, setForm] = useState({
    name:   src.name   ?? '',
    age:    src.age    ?? '',
    height: src.height ?? '',
    sex:    src.sex    ?? '',
  })
  const [saved, setSaved] = useState(false)

  const field = key => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const save = () => {
    setState(s => ({ ...s, profile: { ...s.profile, ...form } }))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <CollapsibleSection title="Profile">
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>Name</span>
          <input className={styles.input} type="text" placeholder="—" {...field('name')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Age</span>
          <input className={styles.input} type="number" min="0" placeholder="—" {...field('age')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Height</span>
          <input className={styles.input} type="text" placeholder="5′ 10″" {...field('height')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Sex</span>
          <select className={styles.input} {...field('sex')}>
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
      </div>
      <button className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`} onClick={save}>
        {saved ? 'Saved' : 'Save'}
      </button>
    </CollapsibleSection>
  )
}

function MeasurementsSection({ state, setState }) {
  const src = state.measurements ?? {}
  const [form, setForm] = useState({
    weight:  src.weight  ?? '',
    bodyFat: src.bodyFat ?? '',
    chest:   src.chest   ?? '',
    waist:   src.waist   ?? '',
    hips:    src.hips    ?? '',
    arms:    src.arms    ?? '',
    thighs:  src.thighs  ?? '',
  })
  const [saved, setSaved] = useState(false)

  const field = key => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const save = () => {
    setState(s => ({ ...s, measurements: { ...s.measurements, ...form } }))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <CollapsibleSection title="Weight & Measurements">
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>Body Weight <span className={styles.unit}>lbs</span></span>
          <input className={styles.input} type="number" min="0" step="0.1" placeholder="—" {...field('weight')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Body Fat <span className={styles.unit}>%</span></span>
          <input className={styles.input} type="number" min="0" max="100" step="0.1" placeholder="—" {...field('bodyFat')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Chest <span className={styles.unit}>in</span></span>
          <input className={styles.input} type="number" min="0" step="0.25" placeholder="—" {...field('chest')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Waist <span className={styles.unit}>in</span></span>
          <input className={styles.input} type="number" min="0" step="0.25" placeholder="—" {...field('waist')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Hips <span className={styles.unit}>in</span></span>
          <input className={styles.input} type="number" min="0" step="0.25" placeholder="—" {...field('hips')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Arms <span className={styles.unit}>in</span></span>
          <input className={styles.input} type="number" min="0" step="0.25" placeholder="—" {...field('arms')} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Thighs <span className={styles.unit}>in</span></span>
          <input className={styles.input} type="number" min="0" step="0.25" placeholder="—" {...field('thighs')} />
        </label>
      </div>
      <button className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`} onClick={save}>
        {saved ? 'Saved' : 'Save'}
      </button>
    </CollapsibleSection>
  )
}

function MacroMethodModal({ onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>How Macros Are Calculated</span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalStep}>
            <span className={styles.modalStepNum}>1</span>
            <div>
              <strong>Basal Metabolic Rate (BMR)</strong>
              <p>We use the <em>Mifflin–St Jeor equation</em> to estimate how many calories your body burns at rest, based on your weight, height, age, and sex — the most validated formula for general populations.</p>
            </div>
          </div>
          <div className={styles.modalStep}>
            <span className={styles.modalStepNum}>2</span>
            <div>
              <strong>Total Daily Energy Expenditure (TDEE)</strong>
              <p>BMR is multiplied by an activity factor (1.2–1.9) based on your selected activity level to estimate total daily calorie burn, including exercise and daily movement.</p>
            </div>
          </div>
          <div className={styles.modalStep}>
            <span className={styles.modalStepNum}>3</span>
            <div>
              <strong>Calorie Target</strong>
              <p>A goal-specific adjustment is applied to TDEE — for example, a 500 kcal deficit for weight loss or a 300 kcal surplus for muscle gain.</p>
            </div>
          </div>
          <div className={styles.modalStep}>
            <span className={styles.modalStepNum}>4</span>
            <div>
              <strong>Protein</strong>
              <p>Protein is set using lean body mass (if body fat % is entered) or total body weight. Targets range from 0.75–1.2 g/lb depending on your goal, consistent with research on muscle retention and hypertrophy.</p>
            </div>
          </div>
          <div className={styles.modalStep}>
            <span className={styles.modalStepNum}>5</span>
            <div>
              <strong>Fat & Carbohydrates</strong>
              <p>Remaining calories after protein are split between fat and carbs. Fat takes 30–45% of remaining calories (goal-dependent); carbohydrates fill the rest.</p>
            </div>
          </div>

          <div className={styles.modalDivider} />

          <p className={styles.modalCiteHeading}>References</p>
          <ol className={styles.modalCites}>
            <li>Thom G, et al. "Validity of predictive equations to estimate RMR in females with varying BMI." <em>J Nutr Sci.</em> 2020;9:e17. (Mifflin–St Jeor among most accurate vs. indirect calorimetry.)</li>
            <li>Morton RW, et al. "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults." <em>Br J Sports Med.</em> 2018;52(6):376–384.</li>
            <li>Murphy C, Koehler K. "Energy deficiency impairs resistance training gains in lean mass but not strength." <em>Scand J Med Sci Sports.</em> 2022;32(1):125–137.</li>
            <li>Prado-Nóvoa O, et al. "Validity of predictive equations for total energy expenditure against doubly labeled water." <em>Sci Rep.</em> 2024;14:15754.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

function MacrosSection({ state, setState }) {
  const src = state.macroGoal ?? {}
  const [form, setForm] = useState({
    goal:          src.goal          ?? '',
    activityLevel: src.activityLevel ?? '',
  })
  const [saved, setSaved] = useState(false)
  const [showMethod, setShowMethod] = useState(false)

  const save = () => {
    setState(s => ({ ...s, macroGoal: { ...s.macroGoal, ...form } }))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  // Live preview: use saved profile/measurements but current form selections
  const macros = calculateMacros(state.profile, state.measurements, form)

  const missingFields = []
  if (!state.profile?.age)         missingFields.push('age')
  if (!state.profile?.height)      missingFields.push('height')
  if (!state.profile?.sex)         missingFields.push('sex')
  if (!state.measurements?.weight) missingFields.push('body weight')

  return (
    <CollapsibleSection title="Macro Calculator">
      <p className={styles.macroSubhead}>Goal</p>
      <div className={styles.splitOptions}>
        {GOALS.map(g => (
          <label
            key={g.key}
            className={`${styles.splitOption} ${form.goal === g.key ? styles.splitOptionActive : ''}`}
          >
            <input
              type="radio"
              name="macroGoal"
              value={g.key}
              checked={form.goal === g.key}
              onChange={() => setForm(f => ({ ...f, goal: g.key }))}
            />
            <div>
              <div>{g.label}</div>
              <div className={styles.macroOptionDesc}>{g.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <p className={styles.macroSubhead} style={{ marginTop: 16 }}>Activity Level</p>
      <div className={styles.splitOptions}>
        {ACTIVITY_LEVELS.map(a => (
          <label
            key={a.key}
            className={`${styles.splitOption} ${form.activityLevel === a.key ? styles.splitOptionActive : ''}`}
          >
            <input
              type="radio"
              name="activityLevel"
              value={a.key}
              checked={form.activityLevel === a.key}
              onChange={() => setForm(f => ({ ...f, activityLevel: a.key }))}
            />
            <div>
              <div>{a.label}</div>
              <div className={styles.macroOptionDesc}>{a.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <button className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`} onClick={save}>
        {saved ? 'Saved' : 'Save'}
      </button>

      {macros && (
        <div className={styles.macroResults}>
          <div className={styles.macroCalRow}>
            <div className={styles.macroCalMain}>
              <span className={styles.macroCalValue}>{macros.calories.toLocaleString()}</span>
              <span className={styles.macroCalUnit}>kcal / day</span>
            </div>
            <span className={styles.macroTdee}>TDEE {macros.tdee.toLocaleString()} kcal</span>
          </div>
          <div className={styles.macroGrid}>
            <div className={styles.macroCard}>
              <span className={styles.macroCardValue}>{macros.protein}g</span>
              <span className={styles.macroCardLabel}>Protein</span>
            </div>
            <div className={styles.macroCard}>
              <span className={styles.macroCardValue}>{macros.carbs}g</span>
              <span className={styles.macroCardLabel}>Carbs</span>
            </div>
            <div className={styles.macroCard}>
              <span className={styles.macroCardValue}>{macros.fat}g</span>
              <span className={styles.macroCardLabel}>Fat</span>
            </div>
          </div>
          <p className={styles.macroNote}>{macros.note}</p>
          {macros.usingLbm && (
            <p className={`${styles.note} ${styles.macroLbmNote}`}>Protein based on lean body mass.</p>
          )}
        </div>
      )}

      {!macros && form.goal && form.activityLevel && (
        <p className={`${styles.note} ${styles.macroMissing}`}>
          {missingFields.length > 0
            ? `Add your ${missingFields.join(', ')} in Profile & Measurements above to see your macros.`
            : `Check that your height is formatted correctly (e.g. 5'10" or 5 10) and body weight is set.`}
        </p>
      )}

      <p className={styles.macroDisclaimer}>
        These estimates are for informational purposes only and do not constitute medical or dietary advice. Consult a qualified healthcare provider before making any changes to your diet or nutrition.
      </p>

      <button className={styles.macroMethodBtn} onClick={() => setShowMethod(true)}>
        How is this calculated?
      </button>

      {showMethod && <MacroMethodModal onClose={() => setShowMethod(false)} />}
    </CollapsibleSection>
  )
}

const ORM_FIELDS = [
  { key: 'benchPress',    label: 'Bench Press'     },
  { key: 'squat',         label: 'Squat'           },
  { key: 'deadlift',      label: 'Deadlift'        },
  { key: 'overheadPress', label: 'Overhead Press'  },
  { key: 'barbellRow',    label: 'Barbell Row'     },
  { key: 'pullUp',        label: 'Pull-up'         },
]

function OneRepMaxSection({ state, setState }) {
  const src = state.oneRepMax ?? {}
  const [form, setForm] = useState(
    Object.fromEntries(ORM_FIELDS.map(f => [f.key, src[f.key] ?? '']))
  )
  const [saved, setSaved] = useState(false)

  const field = key => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const save = () => {
    setState(s => ({ ...s, oneRepMax: { ...s.oneRepMax, ...form } }))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <CollapsibleSection title="One Rep Max">
      <div className={styles.grid2}>
        {ORM_FIELDS.map(f => (
          <label key={f.key} className={styles.field}>
            <span className={styles.label}>{f.label} <span className={styles.unit}>lbs</span></span>
            <input className={styles.input} type="number" min="0" step="5" placeholder="—" {...field(f.key)} />
          </label>
        ))}
      </div>
      <button className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`} onClick={save}>
        {saved ? 'Saved' : 'Save'}
      </button>
    </CollapsibleSection>
  )
}
