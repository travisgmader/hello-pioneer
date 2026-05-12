import { useState } from 'react'
import styles from './Settings.module.css'
import AdminPanel from './AdminPanel.jsx'

export default function Settings({ state, setState, isAdmin }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <ProfileSection state={state} setState={setState} />
      <MeasurementsSection state={state} setState={setState} />
      <OneRepMaxSection state={state} setState={setState} />
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
