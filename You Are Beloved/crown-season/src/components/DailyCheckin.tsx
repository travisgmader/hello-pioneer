import { useEffect, useRef, useState } from 'react';
import { useJournal } from '../lib/storage';

interface Props {
  /** Reflection prompt to pair with gratitude (varies by study day). */
  reflectionPrompt?: string;
  /** Study-day key this check-in writes to, e.g. "1-1" (week-day). */
  entryKey: string;
  compact?: boolean;
}

const DEFAULT_PROMPT = 'Where did you notice God with you today?';

/** Gratitude + a short reflection for one study day, debounced + synced. */
export default function DailyCheckin({ reflectionPrompt = DEFAULT_PROMPT, entryKey, compact }: Props) {
  const { get, save } = useJournal();
  const entry = get(entryKey);

  const [gratitude, setGratitude] = useState(entry.gratitude);
  const [reflection, setReflection] = useState(entry.reflection);
  const [savedAt, setSavedAt] = useState<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the fields when switching to a different study day.
  useEffect(() => {
    setGratitude(entry.gratitude);
    setReflection(entry.reflection);
    setSavedAt(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryKey]);

  function schedule(next: { gratitude?: string; reflection?: string }) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      save(entryKey, next);
      setSavedAt(Date.now());
    }, 500);
  }

  return (
    <section className="checkin" aria-label="Daily check-in">
      {!compact && <div className="block-label">Daily Check-In</div>}
      <label className="field-label" htmlFor="grat">🙏 Today I’m grateful for…</label>
      <textarea
        id="grat"
        className="input"
        placeholder="Name one thing. It counts even if it’s small."
        value={gratitude}
        onChange={(e) => {
          setGratitude(e.target.value);
          schedule({ gratitude: e.target.value });
        }}
      />

      <div style={{ height: 14 }} />

      <label className="field-label" htmlFor="refl">✍️ Reflection</label>
      <p className="field-hint">{reflectionPrompt}</p>
      <textarea
        id="refl"
        className="input"
        placeholder="A sentence is enough."
        value={reflection}
        onChange={(e) => {
          setReflection(e.target.value);
          schedule({ reflection: e.target.value });
        }}
      />
      <div className="saved-note">{savedAt ? 'Saved ✓' : ''}</div>
    </section>
  );
}
