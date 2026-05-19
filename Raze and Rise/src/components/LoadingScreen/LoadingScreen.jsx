import { useEffect, useState } from 'react'
import styles from './LoadingScreen.module.css'

const ANUBIS_SRC = 'https://lh3.googleusercontent.com/aida-public/AB6AXuChpjSrlAu3_JOAPL24MEyb4CCGqO9lzDW6d3BLIdBadR6jRoLaooNMo9DB7JMgft_5ucB6YBYrWTf3nghtHaWMQGzbHmcEjtrb50pzpIaXLpV9YxxHpy1D-MoAGmr5QfAOHD3LwUdmsMZzrFzSjNjlJ8Y4Vai2RJKVNew0_GAADK81yzwiZeXp1O3ms5Y3P3ZrI3jO6ciVtaEljxXGmqFMjdQuBHZBu245O_4OA9FhiwzWaFLe0NRz9TUtJmmZjNWnrMtrpp1ZRgo'

function AnubisIcon() {
  return (
    <div className={styles.anubis}>
      <img className={styles.anubisImg} src={ANUBIS_SRC} alt="Anubis" />
    </div>
  )
}

export default function LoadingScreen({ onDone }) {
  const [split, setSplit] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setSplit(true), 1800),
      setTimeout(onDone,               2750),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  return (
    <div className={styles.root}>
      <div className={`${styles.halfTop}    ${split ? styles.halfTopSplit    : ''}`} />
      <div className={`${styles.halfBottom} ${split ? styles.halfBottomSplit : ''}`} />

      <div className={`${styles.content} ${split ? styles.contentGone : ''}`}>
        <AnubisIcon />
        <p className={styles.title}>RAZE & RISE</p>
      </div>
    </div>
  )
}
