import { getSubstitutions } from '../../lib/substitutions.js'
import styles from './SwapModal.module.css'

export default function SwapModal({ exerciseName, onSelect, onClose }) {
  const options = getSubstitutions(exerciseName)

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.subLabel}>Swap exercise</span>
          <h2 className={styles.currentName}>{exerciseName}</h2>
        </div>

        {options.length === 0 ? (
          <p className={styles.empty}>
            No substitutions found for this exercise.
          </p>
        ) : (
          <ul className={styles.list}>
            {options.map(name => (
              <li key={name}>
                <button className={styles.option} onClick={() => onSelect(name)}>
                  {name}
                  <span className={styles.optionArrow}>→</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button className={styles.keepBtn} onClick={onClose}>
          Keep original
        </button>
      </div>
    </>
  )
}
