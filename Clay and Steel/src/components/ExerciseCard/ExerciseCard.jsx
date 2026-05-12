import styles from './ExerciseCard.module.css'

const PCTS = [55, 60, 65, 70, 75, 80, 85, 90]

function roundToPlate(lbs) {
  return Math.round(lbs / 2.5) * 2.5
}

export default function ExerciseCard({
  exercise, weight, results,
  weightMethod, orm, pct,
  onWeightChange, onOrmChange, onPctChange,
  onMark,
}) {
  const isOrm = weightMethod === 'orm'
  const isRun = exercise.type === 'run'

  const handleOrmChange = val => {
    const n = val === '' ? null : Number(val)
    onOrmChange(n)
    if (n && pct) onWeightChange(roundToPlate(n * pct / 100))
  }

  const handlePctChange = p => {
    onPctChange(p)
    if (orm) onWeightChange(roundToPlate(orm * p / 100))
  }

  if (isRun) {
    return (
      <div className={styles.card}>
        <h3 className={`${styles.name} ${styles.runName}`}>{exercise.name}</h3>
        {(exercise.paceTarget || exercise.paceHint) && (
          <div className={styles.runMeta}>
            {exercise.paceTarget && <span className={styles.paceTarget}>{exercise.paceTarget}</span>}
            {exercise.paceHint   && <span className={styles.paceHint}>{exercise.paceHint}</span>}
          </div>
        )}
        <div className={styles.setRows}>
          {Array.from({ length: exercise.sets }).map((_, i) => {
            const setResult = results[i]
            return (
              <div key={i} className={styles.setRow}>
                <span className={styles.setNum}>
                  {exercise.sets > 1 ? `× ${i + 1}` : '—'}
                </span>
                <button
                  className={`${styles.btn} ${styles.go} ${setResult === 'go' ? styles.goActive : ''}`}
                  onClick={() => onMark(i, setResult === 'go' ? null : 'go')}
                >
                  Go
                </button>
                <button
                  className={`${styles.btn} ${styles.nogo} ${setResult === 'no-go' ? styles.nogoActive : ''}`}
                  onClick={() => onMark(i, setResult === 'no-go' ? null : 'no-go')}
                >
                  No-Go
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{exercise.name}</h3>
        <span className={styles.range}>
          {exercise.repLow}–{exercise.repHigh} reps
        </span>
      </div>

      {isOrm && (
        <div className={styles.ormSection}>
          <div className={styles.ormRow}>
            <span className={styles.ormLabel}>1RM</span>
            <div className={styles.weightInputWrap}>
              <input
                className={styles.weightInput}
                type="number"
                min={0}
                step={5}
                value={orm ?? ''}
                placeholder="—"
                onChange={e => handleOrmChange(e.target.value === '' ? '' : e.target.value)}
              />
              <span className={styles.weightUnit}>lbs</span>
            </div>
          </div>
          <div className={styles.pctRow}>
            <span className={styles.ormLabel}>%</span>
            <div className={styles.pctBtns}>
              {PCTS.map(p => (
                <button
                  key={p}
                  className={`${styles.pctBtn} ${pct === p ? styles.pctBtnActive : ''}`}
                  onClick={() => handlePctChange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.weightRow}>
        <span className={styles.weightLabel}>Weight</span>
        <div className={styles.weightInputWrap}>
          <input
            className={styles.weightInput}
            type="number"
            min={0}
            step={2.5}
            value={weight ?? ''}
            placeholder="—"
            onChange={e =>
              onWeightChange(e.target.value === '' ? null : Number(e.target.value))
            }
          />
          <span className={styles.weightUnit}>lbs</span>
        </div>
      </div>

      <div className={styles.setRows}>
        {Array.from({ length: exercise.sets }).map((_, i) => {
          const setResult = results[i]
          return (
            <div key={i} className={styles.setRow}>
              <span className={styles.setNum}>Set {i + 1}</span>
              <button
                className={`${styles.btn} ${styles.go} ${setResult === 'go' ? styles.goActive : ''}`}
                onClick={() => onMark(i, setResult === 'go' ? null : 'go')}
              >
                Go
              </button>
              <button
                className={`${styles.btn} ${styles.nogo} ${setResult === 'no-go' ? styles.nogoActive : ''}`}
                onClick={() => onMark(i, setResult === 'no-go' ? null : 'no-go')}
              >
                No-Go
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
