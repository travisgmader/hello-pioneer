/**
 * Family Creation Wizard — ONBD-01.
 *
 * Single-screen wizard that creates a family space for a newly authenticated
 * user who has no family yet. RequireFamily (inside RootLayout) redirects here
 * when useCurrentFamily returns null.
 *
 * Three sequential INSERTs in this exact order (required by bootstrap RLS policies
 * added in Plan 02):
 *   1. families      — families_insert policy: with check (true) for any auth user
 *   2. members       — members_insert_bootstrap: auth user with no prior member rows
 *   3. family_settings — family_settings_insert_bootstrap: user is family's created_by
 *
 * All inserts use the user's anon JWT — NO service-role bypass.
 *
 * IMPORTANT: Do NOT set rc_app_user_id during wizard submit. RevenueCat sets it
 * automatically via webhook when the user first purchases (Task 5.3).
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { DateTime } from 'luxon';
import { supabase } from '../../data/supabase';
import { newId } from '../../lib/newId';
import { computeTrialEnd } from '../../lib/trialEnd';
import styles from './create-family.module.css';

const EMOJI_CHIPS = ['🏠', '🌳', '🌟', '🌈', '🏡', '🦊', '🐝', '🌻'] as const;

/** Returns 'midnight' for dark-mode OS preference, 'lavender' otherwise. */
function osDefault(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'midnight'
    : 'lavender';
}

export default function CreateFamily() {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string>('🏠');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createFamily = useMutation({
    mutationFn: async () => {
      // 1. Resolve authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 2. Generate IDs and trial expiry
      const familyId = newId();
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const trialEndsAt = computeTrialEnd(
        DateTime.now().setZone(browserTz),
      ).toISO();

      // INSERT 1: families (families_insert policy: with check true)
      const { error: e1 } = await supabase.from('families').insert({
        id: familyId,
        name: name.trim(),
        emoji,
        created_by: user.id,
      });
      if (e1) throw e1;

      // INSERT 2: members — submitting user becomes the family's first parent
      // members_insert_bootstrap allows this because the user has no prior member rows.
      const fallbackName = user.email!.split('@')[0]!;
      const { error: e2 } = await supabase.from('members').insert({
        family_id: familyId,
        auth_user_id: user.id,
        email: user.email!.toLowerCase(),
        name:
          (user.user_metadata?.full_name as string | undefined) ?? fallbackName,
        role: 'parent',
      });
      if (e2) throw e2;

      // INSERT 3: family_settings — family_settings_insert_bootstrap allows this
      // because the user is the family's created_by.
      const { error: e3 } = await supabase.from('family_settings').insert({
        family_id: familyId,
        timezone: browserTz,
        theme: osDefault(),
        trial_ends_at: trialEndsAt,
      });
      if (e3) throw e3;

      return familyId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['current-family'] });
      navigate('/dashboard', { replace: true });
    },
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Name your family</h1>

        <label className={styles.label} htmlFor="family-name">
          What should we call your family?
        </label>
        <input
          id="family-name"
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Mader Family"
          required
          minLength={1}
          maxLength={80}
        />

        <label className={styles.label}>Pick a family emoji</label>
        <div className={styles.emojiRow}>
          {EMOJI_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className={styles.emojiChip}
              data-active={emoji === chip}
              onClick={() => setEmoji(chip)}
              aria-label={`Select emoji ${chip}`}
            >
              {chip}
            </button>
          ))}
        </div>

        <p className={styles.helper}>
          This is just for you — you can change it later in Settings.
        </p>

        {createFamily.error && (
          <p className={styles.error}>
            {createFamily.error instanceof Error
              ? createFamily.error.message
              : String(createFamily.error)}
          </p>
        )}

        <button
          className={styles.primary}
          type="submit"
          disabled={createFamily.isPending || !name.trim()}
          onClick={() => createFamily.mutate()}
        >
          {createFamily.isPending
            ? 'Setting up your family…'
            : 'Create my family'}
        </button>
      </div>
    </div>
  );
}
