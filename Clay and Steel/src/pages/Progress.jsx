import { useMemo, useState } from 'react'
import styles from './Progress.module.css'

// ─── data helpers ───────────────────────────────────────────

function fmtDate(d, opts = { month: 'short', day: 'numeric' }) {
  return new Date(d).toLocaleDateString('en-US', opts)
}

function extractExercises(history) {
  const names = new Set()
  for (const w of history) {
    for (const s of Object.values(w.sets ?? {})) {
      if (s.name) names.add(s.name)
    }
  }
  return [...names].sort()
}

function buildWeightSeries(history, name) {
  const points = []
  for (const w of history) {
    for (const s of Object.values(w.sets ?? {})) {
      if (s.name !== name || s.weight == null) continue
      const results = s.results ?? []
      const go    = results.filter(r => r === 'go').length
      const nogo  = results.filter(r => r === 'no-go').length
      const total = go + nogo
      points.push({
        date:   new Date(w.completedAt ?? w.startedAt),
        weight: parseFloat(s.weight),
        go,
        nogo,
        total,
        allGo: total > 0 && nogo === 0,
        hasNogo: nogo > 0,
      })
      break
    }
  }
  return points.sort((a, b) => a.date - b.date)
}

function buildVolumeSeries(history) {
  return history.slice(-16).map(w => {
    let go = 0, nogo = 0
    for (const s of Object.values(w.sets ?? {})) {
      for (const r of (s.results ?? [])) {
        if (r === 'go') go++
        else if (r === 'no-go') nogo++
      }
    }
    return {
      date:  new Date(w.completedAt ?? w.startedAt),
      label: w.dayLabel ?? '',
      go,
      nogo,
      total: go + nogo,
    }
  })
}

function computeSummary(history) {
  if (!history.length) return null

  let totalGo = 0, totalNogo = 0
  const prMap = {}
  const weightByExercise = {}

  for (const w of history) {
    for (const s of Object.values(w.sets ?? {})) {
      const results = s.results ?? []
      for (const r of results) {
        if (r === 'go') totalGo++
        else if (r === 'no-go') totalNogo++
      }
      if (s.name && s.weight != null) {
        const wt = parseFloat(s.weight)
        prMap[s.name] = Math.max(prMap[s.name] ?? 0, wt)
        if (!weightByExercise[s.name]) weightByExercise[s.name] = []
        weightByExercise[s.name].push({ date: w.completedAt ?? w.startedAt, weight: wt })
      }
    }
  }

  const totalSets = totalGo + totalNogo
  const goRate = totalSets > 0 ? Math.round((totalGo / totalSets) * 100) : null

  // Consecutive week streak (from most recent backward)
  const weekKeys = new Set()
  for (const w of history) {
    const d = new Date(w.completedAt ?? w.startedAt)
    d.setDate(d.getDate() - d.getDay())
    weekKeys.add(d.toDateString())
  }
  let streak = 0
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - cursor.getDay())
  while (weekKeys.has(cursor.toDateString())) {
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }

  // Best progression (largest absolute weight increase, first → last session)
  let bestGain = null
  for (const [name, entries] of Object.entries(weightByExercise)) {
    if (entries.length < 2) continue
    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))
    const gain = sorted[sorted.length - 1].weight - sorted[0].weight
    if (gain > 0 && (!bestGain || gain > bestGain.gain)) {
      bestGain = { name, gain }
    }
  }

  return { totalWorkouts: history.length, goRate, totalSets, streak, bestGain, prMap }
}

// ─── SVG charts ─────────────────────────────────────────────

const CW = 540
const CHART_H = 150
const PAD = { l: 48, r: 16, t: 14, b: 32 }

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }

function LineChart({ points }) {
  if (points.length === 0) return <p className={styles.noData}>No data for this exercise yet.</p>
  if (points.length === 1) {
    const p = points[0]
    return (
      <div className={styles.singlePoint}>
        <span className={styles.singleWeight}>{p.weight} lbs</span>
        <span className={styles.singleDate}>{fmtDate(p.date)}</span>
      </div>
    )
  }

  const weights = points.map(p => p.weight)
  const lo = Math.min(...weights)
  const hi = Math.max(...weights)
  const range = hi - lo || 10

  const innerW = CW - PAD.l - PAD.r
  const innerH = CHART_H - PAD.t - PAD.b

  const xOf = i => PAD.l + (i / (points.length - 1)) * innerW
  const yOf = w => PAD.t + (1 - (w - lo) / range) * innerH

  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.weight).toFixed(1)}`
  ).join(' ')

  const areaPath = `${linePath} L${xOf(points.length - 1).toFixed(1)},${(PAD.t + innerH).toFixed(1)} L${PAD.l},${(PAD.t + innerH).toFixed(1)}Z`

  // Y-axis ticks
  const yTicks = range > 0
    ? [lo, lo + range * 0.5, hi]
    : [lo - 5, lo, lo + 5]

  // X-axis labels — at most 6, always include first and last
  const step = Math.max(1, Math.ceil(points.length / 5))
  const xLabelIdx = new Set([0, points.length - 1])
  for (let i = step; i < points.length - 1; i += step) xLabelIdx.add(i)

  const first = points[0].weight
  const last  = points[points.length - 1].weight
  const delta = last - first
  const deltaColor = delta > 0 ? 'var(--accent-go)' : delta < 0 ? 'var(--accent-nogo)' : 'var(--text-muted)'

  return (
    <div>
      <div className={styles.chartMeta}>
        <span className={styles.chartCurrent}>{last} lbs</span>
        <span className={styles.chartDelta} style={{ color: deltaColor }}>
          {delta > 0 ? '+' : ''}{delta} lbs from start
        </span>
      </div>
      <svg viewBox={`0 0 ${CW} ${CHART_H}`} width="100%" className={styles.svgChart}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#d4af37" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.l} y1={yOf(t)} x2={CW - PAD.r} y2={yOf(t)}
              stroke="rgba(212,175,55,0.1)" strokeWidth="1"
            />
            <text x={PAD.l - 6} y={yOf(t) + 4} textAnchor="end" className={styles.axisText}>
              {Math.round(t)}
            </text>
          </g>
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--accent-deep)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {points.map((p, i) => {
          const c = p.allGo ? 'var(--accent-go)' : p.hasNogo ? 'var(--accent-nogo)' : 'var(--accent)'
          return (
            <circle key={i} cx={xOf(i)} cy={yOf(p.weight)} r="4.5" fill={c} stroke="var(--surface)" strokeWidth="2">
              <title>{fmtDate(p.date, { month: 'short', day: 'numeric', year: 'numeric' })} — {p.weight} lbs ({p.go} go, {p.nogo} no-go)</title>
            </circle>
          )
        })}

        {/* X labels */}
        {[...xLabelIdx].map(i => (
          <text key={i} x={xOf(i)} y={CHART_H - 4} textAnchor="middle" className={styles.axisText}>
            {fmtDate(points[i].date)}
          </text>
        ))}
      </svg>

      {/* Dot legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--accent-go)' }} /> All Go</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--accent-nogo)' }} /> Had No-Go</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--accent)' }} /> No results</span>
      </div>
    </div>
  )
}

function VolumeChart({ data }) {
  if (!data.length) return <p className={styles.noData}>Complete a workout to see volume.</p>

  const H = 110
  const padB = 30, padT = 8, padLR = 8
  const maxTotal = Math.max(...data.map(d => d.total), 1)
  const n = data.length
  const slotW = (CW - padLR * 2) / n
  const barW  = clamp(slotW - 4, 6, 32)

  return (
    <svg viewBox={`0 0 ${CW} ${H}`} width="100%" className={styles.svgChart}>
      {data.map((d, i) => {
        const x     = padLR + i * slotW + (slotW - barW) / 2
        const inner = H - padT - padB
        const goH   = (d.go   / maxTotal) * inner
        const nogoH = (d.nogo / maxTotal) * inner
        const stackH = goH + nogoH

        return (
          <g key={i}>
            {d.nogo > 0 && (
              <rect x={x} y={H - padB - nogoH} width={barW} height={nogoH}
                fill="var(--accent-nogo)" opacity="0.75" rx="1">
                <title>{fmtDate(d.date)} — {d.nogo} no-go</title>
              </rect>
            )}
            {d.go > 0 && (
              <rect x={x} y={H - padB - stackH} width={barW} height={goH}
                fill="var(--accent-go)" opacity="0.85" rx="1">
                <title>{fmtDate(d.date)} — {d.go} go</title>
              </rect>
            )}
            {d.total === 0 && (
              <rect x={x} y={H - padB - 2} width={barW} height={2}
                fill="var(--border)" rx="1" />
            )}
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" className={styles.axisText}>
              {fmtDate(d.date, { month: 'numeric', day: 'numeric' })}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── sub-components ─────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue} style={accent ? { color: accent } : undefined}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

// ─── main page ──────────────────────────────────────────────

export default function Progress({ state }) {
  const history = state.history ?? []
  const summary = useMemo(() => computeSummary(history), [history])
  const exercises = useMemo(() => extractExercises(history), [history])
  const volumeData = useMemo(() => buildVolumeSeries(history), [history])

  const [selectedEx, setSelectedEx] = useState(null)
  const activeEx = selectedEx ?? exercises[0] ?? null

  const weightSeries = useMemo(
    () => (activeEx ? buildWeightSeries(history, activeEx) : []),
    [history, activeEx]
  )

  if (!history.length) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Progress</h1>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◎</div>
          <h2>No workouts yet</h2>
          <p>Complete your first workout on the Dashboard to start tracking progress.</p>
        </div>
      </div>
    )
  }

  const goColor =
    !summary?.goRate        ? 'var(--text-muted)' :
    summary.goRate >= 80    ? 'var(--accent-go)'  :
    summary.goRate >= 60    ? 'var(--accent)'      :
                              'var(--accent-nogo)'

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Progress</h1>

      {/* ── Summary ── */}
      <div className={styles.statGrid}>
        <StatCard label="Workouts" value={summary.totalWorkouts} />
        <StatCard
          label="Go Rate"
          value={summary.goRate !== null ? `${summary.goRate}%` : '—'}
          sub={`${summary.totalSets} sets tracked`}
          accent={goColor}
        />
        <StatCard
          label="Week Streak"
          value={summary.streak > 0 ? `${summary.streak}w` : '—'}
          sub={summary.streak > 0 ? 'consecutive weeks' : 'no active streak'}
          accent={summary.streak >= 4 ? 'var(--accent-go)' : undefined}
        />
        <StatCard
          label="Best Gain"
          value={summary.bestGain ? `+${summary.bestGain.gain} lbs` : '—'}
          sub={summary.bestGain?.name ?? 'keep lifting'}
          accent={summary.bestGain ? 'var(--accent-go)' : undefined}
        />
      </div>

      {/* ── Weight Progression ── */}
      <Section title="Weight Progression">
        {exercises.length > 0 ? (
          <>
            <div className={styles.pills}>
              {exercises.map(name => (
                <button
                  key={name}
                  className={`${styles.pill} ${activeEx === name ? styles.pillActive : ''}`}
                  onClick={() => setSelectedEx(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <LineChart points={weightSeries} />
          </>
        ) : (
          <p className={styles.noData}>No exercise data yet.</p>
        )}
      </Section>

      {/* ── Volume per Workout ── */}
      <Section title="Sets per Workout">
        <div className={styles.volLegend}>
          <span><span className={styles.legendDot} style={{ background: 'var(--accent-go)' }} /> Go</span>
          <span><span className={styles.legendDot} style={{ background: 'var(--accent-nogo)' }} /> No-Go</span>
        </div>
        <VolumeChart data={volumeData} />
      </Section>

      {/* ── Personal Records ── */}
      {summary?.prMap && Object.keys(summary.prMap).length > 0 && (
        <Section title="Personal Records">
          <div className={styles.prGrid}>
            {Object.entries(summary.prMap)
              .sort((a, b) => b[1] - a[1])
              .map(([name, weight]) => (
                <div key={name} className={styles.prCard}>
                  <div className={styles.prWeight}>{weight} <span className={styles.prUnit}>lbs</span></div>
                  <div className={styles.prName}>{name}</div>
                </div>
              ))
            }
          </div>
        </Section>
      )}

      {/* ── Recent Workouts ── */}
      <Section title="Recent Workouts">
        <div className={styles.recentList}>
          {[...history].reverse().slice(0, 10).map(w => {
            let go = 0, nogo = 0
            for (const s of Object.values(w.sets ?? {})) {
              for (const r of (s.results ?? [])) {
                if (r === 'go') go++
                else if (r === 'no-go') nogo++
              }
            }
            const total = go + nogo
            const rate  = total > 0 ? Math.round((go / total) * 100) : null
            const rateColor =
              rate === null   ? 'var(--text-muted)' :
              rate >= 80      ? 'var(--accent-go)'  :
              rate >= 60      ? 'var(--accent)'      :
                                'var(--accent-nogo)'
            return (
              <div key={w.id} className={styles.recentRow}>
                <div className={styles.recentLeft}>
                  <span className={styles.recentDay}>{w.dayLabel}</span>
                  <span className={styles.recentDate}>{fmtDate(w.completedAt ?? w.startedAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className={styles.recentRight}>
                  <span className={styles.recentSets}>{total} sets</span>
                  {rate !== null && (
                    <span className={styles.recentRate} style={{ color: rateColor }}>{rate}% go</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
