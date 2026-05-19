import { useEffect, useState, useMemo } from 'react'
import styles from './WorkoutCompleteOverlay.module.css'

const COLORS = ['#f2ca50', '#d4af37', '#ffffff', '#f5e090', '#e8b84b', '#ffd700', '#fffacd']

function makeParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 1.2,
    duration: 2.2 + Math.random() * 1.6,
    size: 5 + Math.random() * 7,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    isSquare: Math.random() > 0.35,
    drift: (Math.random() - 0.5) * 140,
  }))
}

export default function WorkoutCompleteOverlay({ variant = 'celebratory', dayLabel, onDone }) {
  const [phase, setPhase] = useState('in')
  const particles = useMemo(() => makeParticles(32), [])

  const totalMs  = variant === 'celebratory' ? 4000 : 3000
  const fadeMs   = totalMs - 600

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), fadeMs)
    const t2 = setTimeout(onDone, totalMs)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [variant])

  return (
    <div
      className={[styles.overlay, styles[variant], phase === 'out' ? styles.fadeOut : ''].join(' ')}
      onClick={onDone}
    >
      {variant === 'celebratory'
        ? <Celebratory dayLabel={dayLabel} particles={particles} />
        : <Subtle dayLabel={dayLabel} />
      }
    </div>
  )
}

function Celebratory({ dayLabel, particles }) {
  return (
    <>
      <div className={styles.confettiWrap}>
        {particles.map(p => (
          <div
            key={p.id}
            className={styles.piece}
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: p.isSquare ? `${p.size}px` : `${p.size * 0.45}px`,
              backgroundColor: p.color,
              borderRadius: p.isSquare ? '2px' : '50%',
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
            }}
          />
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.check}>✓</div>
        <h1 className={`${styles.celebTitle} gold-shimmer`}>Workout Complete</h1>
        <p className={styles.dayLabel}>{dayLabel}</p>
      </div>
    </>
  )
}

function Subtle({ dayLabel }) {
  return (
    <div className={styles.subtleWrap}>
      <div className={styles.ring} />
      <div className={styles.ring2} />
      <div className={styles.subtleInner}>
        <span className={styles.subtleCheck}>✓</span>
        <p className={styles.subtleTitle}>Workout Complete</p>
        <div className={styles.subtleLine} />
        <p className={styles.subtleDay}>{dayLabel}</p>
      </div>
    </div>
  )
}
