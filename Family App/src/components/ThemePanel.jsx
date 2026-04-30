import { useState } from 'react';
import styles from './ThemePanel.module.css';

const THEMES = [
  {
    id: 'lavender',
    name: 'Lavender Garden',
    description: 'Soft purples & pastels',
    swatches: ['#c9a8e0', '#8ecf8e', '#f4a0b5', '#fdf6ff'],
  },
  {
    id: 'midnight',
    name: 'Midnight Monolith',
    description: 'Deep dark with gold accents',
    swatches: ['#0c0b0f', '#e9c176', '#10b981', '#16141f'],
  },
];

export default function ThemePanel({ theme, setTheme }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <button
        className={`${styles.gearBtn} ${open ? styles.gearOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Theme settings"
        aria-label="Theme settings"
      >
        ⚙️
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>Choose Theme</div>
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`${styles.themeBtn} ${theme === t.id ? styles.active : ''}`}
                onClick={() => { setTheme(t.id); setOpen(false); }}
              >
                <div className={styles.swatches}>
                  {t.swatches.map((color, i) => (
                    <span key={i} className={styles.swatch} style={{ background: color }} />
                  ))}
                </div>
                <div className={styles.themeInfo}>
                  <span className={styles.themeName}>{t.name}</span>
                  <span className={styles.themeDesc}>{t.description}</span>
                </div>
                {theme === t.id && <span className={styles.check}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
