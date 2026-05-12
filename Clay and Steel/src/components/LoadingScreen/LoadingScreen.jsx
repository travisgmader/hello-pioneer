import { useEffect, useRef, useState } from 'react'
import styles from './LoadingScreen.module.css'

// Deterministic LCG — same seed = same lightning every render pass
function mkRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

// Recursive midpoint displacement — builds fractal lightning path into ctx
function bolt(rng, ctx, x1, y1, x2, y2, disp, depth) {
  if (depth === 0 || disp < 2) {
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    return
  }
  const mx = (x1 + x2) / 2 + (rng() - 0.5) * disp
  const my = (y1 + y2) / 2 + (rng() - 0.5) * disp
  bolt(rng, ctx, x1, y1, mx, my, disp * 0.55, depth - 1)
  bolt(rng, ctx, mx, my, x2, y2, disp * 0.55, depth - 1)
  if (rng() < 0.38 && depth > 1) {
    const angle = Math.atan2(y2 - y1, x2 - x1) + (rng() - 0.5) * 1.5
    const len   = Math.hypot(x2 - x1, y2 - y1) * (0.3 + rng() * 0.4)
    bolt(rng, ctx, mx, my, mx + Math.cos(angle) * len, my + Math.sin(angle) * len, disp * 0.45, depth - 2)
  }
}

function LightningCanvas({ fading }) {
  const ref    = useRef(null)
  const rafRef = useRef(null)
  const t0     = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W   = el.offsetWidth  || window.innerWidth
    const H   = el.offsetHeight || window.innerHeight
    el.width  = W * dpr
    el.height = H * dpr

    const ctx = el.getContext('2d')
    ctx.scale(dpr, dpr)

    const cx = W / 2
    const cy = H / 2

    // Arms radiating outward from center — left/right are the "crack" arms
    const arms = [
      [0,        cy],           // left  (crack)
      [W,        cy],           // right (crack)
      [W * 0.04, H * 0.04],    // upper-left corner
      [W * 0.96, H * 0.04],    // upper-right corner
      [W * 0.08, H * 0.96],    // lower-left corner
      [W * 0.92, H * 0.96],    // lower-right corner
      [W * 0.30, 0],            // top-left
      [W * 0.70, 0],            // top-right
      [W * 0.28, H],            // bottom-left
      [W * 0.72, H],            // bottom-right
    ]

    // Single render pass — all arms drawn with same seed so shapes are identical across passes
    function pass(shadowBlur, lineWidth, color, alpha) {
      ctx.save()
      ctx.shadowBlur  = shadowBlur
      ctx.shadowColor = color
      ctx.strokeStyle = color
      ctx.lineWidth   = lineWidth
      ctx.globalAlpha = alpha
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.beginPath()
      const rng = mkRng(42)
      arms.forEach(([x2, y2]) => {
        bolt(rng, ctx, cx, cy, x2, y2, Math.hypot(x2 - cx, y2 - cy) * 0.45, 7)
      })
      ctx.stroke()
      ctx.restore()
    }

    const maxR = Math.hypot(W, H)

    function frame(ts) {
      if (!t0.current) t0.current = ts
      const progress = Math.min((ts - t0.current) / 550, 1)
      const eased    = 1 - Math.pow(1 - progress, 2.5)

      ctx.clearRect(0, 0, W, H)

      // Radial clip — lightning propagates from center outward
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, maxR * eased, 0, Math.PI * 2)
      ctx.clip()

      pass(50, 14, '#f0a800', 0.09)   // wide outer aura
      pass(20, 8,  '#e8b84b', 0.22)   // medium glow
      pass(6,  2.5,'#e8b84b', 0.50)   // tight glow
      pass(3,  1,  '#fffde0', 0.85)   // core
      pass(1,  0.4,'#ffffff', 0.95)   // bright white spine

      ctx.restore()

      if (progress < 1) rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <canvas
      ref={ref}
      className={`${styles.crackSvg} ${fading ? styles.crackSvgFade : ''}`}
    />
  )
}

const ANUBIS_SRC = 'https://lh3.googleusercontent.com/aida-public/AB6AXuChpjSrlAu3_JOAPL24MEyb4CCGqO9lzDW6d3BLIdBadR6jRoLaooNMo9DB7JMgft_5ucB6YBYrWTf3nghtHaWMQGzbHmcEjtrb50pzpIaXLpV9YxxHpy1D-MoAGmr5QfAOHD3LwUdmsMZzrFzSjNjlJ8Y4Vai2RJKVNew0_GAADK81yzwiZeXp1O3ms5Y3P3ZrI3jO6ciVtaEljxXGmqFMjdQuBHZBu245O_4OA9FhiwzWaFLe0NRz9TUtJmmZjNWnrMtrpp1ZRgo'

function AnubisIcon({ phase }) {
  return (
    <div className={`${styles.anubis} ${styles['anubis_' + phase] ?? ''}`}>
      <img className={styles.anubisImg} src={ANUBIS_SRC} alt="Anubis" />
    </div>
  )
}

export default function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState('enter')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('glow'),  1300),
      setTimeout(() => setPhase('crack'), 1750),
      setTimeout(() => setPhase('split'), 2900),
      setTimeout(onDone,                  3900),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  const isCracking = phase === 'crack' || phase === 'split'
  const isSplit    = phase === 'split'

  return (
    <div className={styles.root}>
      <div className={`${styles.halfTop}    ${isSplit ? styles.halfTopSplit    : ''}`} />
      <div className={`${styles.halfBottom} ${isSplit ? styles.halfBottomSplit : ''}`} />

      {isCracking && <LightningCanvas fading={isSplit} />}

      <div className={`${styles.content} ${isSplit ? styles.contentGone : ''}`}>
        <AnubisIcon phase={phase} />
        <p className={styles.title}>RAZE & RISE</p>
      </div>
    </div>
  )
}
