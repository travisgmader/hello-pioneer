import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './Notes.module.css';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function fetchNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setNotes(data);
    setLoading(false);
  }

  useEffect(() => { fetchNotes(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('notes').insert({ title: title.trim(), body: body.trim() });
    if (error) {
      setError(error.message);
    } else {
      setTitle('');
      setBody('');
      await fetchNotes();
    }
    setSubmitting(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📝 Notes</h1>
        <p className={styles.subtitle}>Shared family notes</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={submitting}
          required
        />
        <textarea
          className={styles.textarea}
          placeholder="Write a note…"
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={submitting}
          required
          rows={4}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submit} type="submit" disabled={submitting || !title.trim() || !body.trim()}>
          {submitting ? 'Posting…' : 'Post Note'}
        </button>
      </form>

      {loading ? (
        <p className={styles.empty}>Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className={styles.empty}>No notes yet. Be the first to post one!</p>
      ) : (
        <div className={styles.list}>
          {notes.map(note => (
            <div key={note.id} className={styles.card}>
              <div className={styles.cardTitle}>{note.title}</div>
              <div className={styles.cardBody}>{note.body}</div>
              <div className={styles.cardDate}>
                {new Date(note.created_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
