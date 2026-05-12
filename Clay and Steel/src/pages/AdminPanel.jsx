import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import styles from './AdminPanel.module.css'

function computeMetrics(state) {
  const history = state?.history ?? []
  const base = { totalWorkouts: 0, goRate: null, lastDateStr: null, frequency: null, topExercises: [], daysSinceLast: null, totalSets: 0 }
  if (!history.length) return base

  let totalGo = 0, totalNogo = 0
  const exerciseData = {}

  for (const workout of history) {
    for (const setData of Object.values(workout.sets ?? {})) {
      const name = setData.name
      if (!name) continue
      const weight = parseFloat(setData.weight) || 0
      for (const r of (setData.results ?? [])) {
        if (r === 'go') totalGo++
        else if (r === 'no-go') totalNogo++
      }
      if (weight > 0 && workout.completedAt) {
        if (!exerciseData[name]) exerciseData[name] = []
        exerciseData[name].push({ date: workout.completedAt, weight })
      }
    }
  }

  const totalSets = totalGo + totalNogo
  const goRate = totalSets > 0 ? Math.round((totalGo / totalSets) * 100) : null

  const topExercises = Object.entries(exerciseData)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)
    .map(([name, entries]) => {
      const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))
      const first = sorted[0].weight
      const last = sorted[sorted.length - 1].weight
      const trend = last > first ? 'up' : last < first ? 'down' : 'flat'
      return { name, weight: last, trend, sessions: entries.length }
    })

  const lastWorkout = history[history.length - 1]
  const lastDate = lastWorkout?.completedAt ? new Date(lastWorkout.completedAt) : null
  const lastDateStr = lastDate
    ? lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const daysSinceLast = lastDate
    ? Math.floor((Date.now() - lastDate) / 86400000)
    : null

  let frequency = null
  if (history.length >= 2) {
    const t0 = new Date(history[0].completedAt ?? history[0].startedAt)
    const t1 = new Date(lastWorkout.completedAt ?? lastWorkout.startedAt)
    const weeks = Math.max((t1 - t0) / 604800000, 0.1)
    frequency = (history.length / weeks).toFixed(1)
  }

  return { totalWorkouts: history.length, goRate, lastDateStr, frequency, topExercises, daysSinceLast, totalSets }
}

export default function AdminPanel() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: states, error: statesErr }, { data: profiles, error: profErr }] = await Promise.all([
        supabase.from('user_state').select('user_id, state, updated_at'),
        supabase.from('profiles').select('id, email'),
      ])
      if (statesErr) throw statesErr
      if (profErr) throw profErr

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.email]))
      const result = (states ?? [])
        .map(row => ({
          userId: row.user_id,
          email: profileMap[row.user_id] ?? row.user_id,
          metrics: computeMetrics(row.state),
          profile: row.state?.profile ?? {},
        }))
        .sort((a, b) => b.metrics.totalWorkouts - a.metrics.totalWorkouts)
      setUsers(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.panel}>
      <button className={styles.header} onClick={() => setOpen(o => !o)} type="button">
        <span className={styles.badge}>ADMIN</span>
        <h2 className={styles.title}>User Progression</h2>
        <span className={`${styles.chevron} ${open ? '' : styles.chevronCollapsed}`} />
      </button>

      {open && (
        <div className={styles.body}>
          {!users && !loading && (
            <button className={styles.loadBtn} onClick={load}>Load User Data</button>
          )}
          {loading && <p className={styles.status}>Loading…</p>}
          {error && <p className={styles.error}>{error}</p>}
          {users && (
            <>
              <div className={styles.refreshRow}>
                <span className={styles.count}>{users.length} user{users.length !== 1 ? 's' : ''}</span>
                <button className={styles.refreshBtn} onClick={load}>Refresh</button>
              </div>
              <div className={styles.grid}>
                {users.map(u => <UserCard key={u.userId} user={u} />)}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

const TREND = {
  up:   { icon: '↑', color: 'var(--accent-go)' },
  down: { icon: '↓', color: 'var(--accent-nogo)' },
  flat: { icon: '→', color: 'var(--text-muted)' },
}

function UserCard({ user }) {
  const { metrics, profile, email } = user
  const displayName = profile.name || email
  const goColor =
    metrics.goRate === null   ? 'var(--text-muted)' :
    metrics.goRate >= 80      ? 'var(--accent-go)'  :
    metrics.goRate >= 60      ? 'var(--accent)'      :
                                'var(--accent-nogo)'

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardId}>
          <div className={styles.userName}>{displayName}</div>
          {profile.name && <div className={styles.userEmail}>{email}</div>}
        </div>
        {metrics.goRate !== null && (
          <div className={styles.goRate} style={{ color: goColor }}>
            {metrics.goRate}%
            <span className={styles.goLabel}>GO</span>
          </div>
        )}
      </div>

      <div className={styles.stats}>
        <Stat label="Workouts" value={metrics.totalWorkouts} />
        <Stat label="Last Active" value={metrics.lastDateStr ?? '—'} />
        <Stat label="Freq / wk" value={metrics.frequency ?? '—'} />
        <Stat label="Days Since" value={metrics.daysSinceLast !== null ? `${metrics.daysSinceLast}d` : '—'} />
      </div>

      {metrics.topExercises.length > 0 ? (
        <div className={styles.exercises}>
          <div className={styles.exHeader}>Top Exercises</div>
          {metrics.topExercises.map(ex => (
            <div key={ex.name} className={styles.exRow}>
              <span className={styles.exName}>{ex.name}</span>
              <span className={styles.exSessions}>{ex.sessions}×</span>
              <span className={styles.exWeight}>{ex.weight} lbs</span>
              <span className={styles.exTrend} style={{ color: TREND[ex.trend].color }}>
                {TREND[ex.trend].icon}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noData}>No workouts recorded yet</p>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}
