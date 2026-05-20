import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Deterministic UUIDv5 using Deno Web Crypto.
 * Namespace: URL namespace "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
 * Joins all parts with ":" before hashing — ensures idempotency across re-runs.
 */
async function deterministicUuid(...parts: string[]): Promise<string> {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const name = parts.join(':');
  const nsBytes = namespace.replace(/-/g, '').match(/../g)!.map(h => parseInt(h, 16));
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array([...nsBytes, ...nameBytes]);
  const hash = await crypto.subtle.digest('SHA-1', data);
  const bytes = new Uint8Array(hash).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function kgFromLbs(lbs: number): number {
  return lbs * 0.45359237;
}

function parseWeight(w: string | number | undefined): number | null {
  if (!w && w !== 0) return null;
  const n = typeof w === 'number' ? w : parseFloat(String(w));
  return isNaN(n) || n <= 0 ? null : n;
}

/**
 * v1 exercise names that differ from v2 seeded exercise names.
 * Keys are normalized (lowercase, trimmed). Values are the exact v2 seeded name.
 *
 * Known mismatches from v1-sample-state.json:
 *   "Pull-Up"         → ILIKE match → "Pull-up" (case-insensitive, handled by ILIKE)
 *   "Barbell Row"     → alias      → "Bent-over Row"
 *   "Seated Cable Row"→ alias      → "Cable Row"
 */
const EXERCISE_NAME_ALIASES: Record<string, string> = {
  'barbell row': 'Bent-over Row',
  'seated cable row': 'Cable Row',
};

// ---------------------------------------------------------------------------
// v1 blob shape (confirmed from v1-sample-state.json)
// ---------------------------------------------------------------------------

interface V1Profile {
  name: string;
  age: string;
  sex: string;
  height: string;
}

interface V1Settings {
  split: string;
  splitPhase: number;
  weightMethod: string;
  hybridSequence: string[];
  splitStartedAt: string;
}

interface V1Rotation {
  pointer: number;
}

interface V1Exercise {
  id: string;
  name: string;
  sets: number;
  repLow: number;
  repHigh: number;
}

interface V1Template {
  id: string;
  dayLabel: string;
  exercises: V1Exercise[];
  uploadedAt: string;
}

interface V1Measurements {
  arms: string;
  hips: string;
  chest: string;
  waist: string;
  thighs: string;
  weight: string;
  bodyFat: string;
}

interface V1HistorySet {
  exercise_id?: string;
  weight?: string | number;
  reps?: string | number;
  result?: string;
}

interface V1HistoryEntry {
  id?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  sets?: V1HistorySet[];
}

// ---------------------------------------------------------------------------
// Main Edge Function
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Validate Authorization header — JWT validation is handled manually
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // SUPABASE_ANON_KEY is used ONLY for JWT validation (server-side Deno env).
  // It is never shipped to the client bundle — this is the correct pattern for
  // Edge Functions that need to validate a user JWT before using the admin client.
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Validate the user's JWT using the anon client (no RLS bypass here)
  const userClient = createClient(supabaseUrl, publicKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin client — bypasses RLS for migration writes. Service role key is
  // never shipped to the client bundle (T-05-E-01 mitigation).
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // ------------------------------------------------------------------
    // Idempotent fast-path: already migrated
    // ------------------------------------------------------------------
    const { data: profileRow } = await admin
      .from('profiles')
      .select('migration_status')
      .eq('user_id', user.id)
      .single();

    if (profileRow?.migration_status === 'complete') {
      return new Response(JSON.stringify({ status: 'complete' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark in_progress so the client can poll
    await admin
      .from('profiles')
      .update({ migration_status: 'in_progress' })
      .eq('user_id', user.id);

    // ------------------------------------------------------------------
    // Fetch v1 blob from user_state (read-only — T-05-I-01 / DATA-01)
    // ------------------------------------------------------------------
    const { data: stateRow } = await admin
      .from('user_state')
      .select('state,updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!stateRow) {
      // New user — no v1 data. Skip migration entirely.
      await admin
        .from('profiles')
        .update({ migration_status: 'none' })
        .eq('user_id', user.id);
      return new Response(JSON.stringify({ status: 'none' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const s = stateRow.state as Record<string, unknown>;
    const profile_v1 = s.profile as V1Profile | undefined;
    const settings = s.settings as V1Settings | undefined;
    const rotation = s.rotation as V1Rotation | undefined;
    const templates = s.templates as Record<string, V1Template> | undefined;
    const history = Array.isArray(s.history) ? (s.history as V1HistoryEntry[]) : [];
    const measurements_v1 = s.measurements as V1Measurements | undefined;

    // ------------------------------------------------------------------
    // 1. Profile upsert — only write non-empty fields from v1
    // ------------------------------------------------------------------
    const profileUpdate: Record<string, unknown> = {};
    if (profile_v1?.name) profileUpdate.display_name = profile_v1.name;
    if (profile_v1?.age) {
      const parsedAge = parseInt(profile_v1.age, 10);
      if (!isNaN(parsedAge)) profileUpdate.age = parsedAge;
    }
    if (profile_v1?.height) {
      const h = parseFloat(profile_v1.height);
      if (!isNaN(h) && h > 0) {
        // Treat values < 100 as inches (convert to cm), otherwise assume cm
        profileUpdate.height_cm = h < 100 ? h * 2.54 : h;
      }
    }
    if (profile_v1?.sex) profileUpdate.sex = profile_v1.sex;

    // v1 blob has no `units` field — default to lbs (T-05 spec note)
    profileUpdate.units = 'lbs';

    if (Object.keys(profileUpdate).length > 0) {
      await admin
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', user.id);
    }

    // ------------------------------------------------------------------
    // 2. Initial measurements upsert (only if weight or bodyFat non-empty)
    // ------------------------------------------------------------------
    const weightRaw = parseWeight(measurements_v1?.weight);
    const bodyFatRaw = parseWeight(measurements_v1?.bodyFat);

    if (weightRaw !== null || bodyFatRaw !== null) {
      const measId = await deterministicUuid(user.id, 'm-initial');
      await admin.from('measurements').upsert(
        {
          id: measId,
          user_id: user.id,
          measured_at: stateRow.updated_at ?? new Date().toISOString(),
          weight_kg: weightRaw !== null ? kgFromLbs(weightRaw) : null,
          body_fat_pct: bodyFatRaw,
        },
        { onConflict: 'id' },
      );
    }

    // ------------------------------------------------------------------
    // 3. Split settings upsert
    // ------------------------------------------------------------------
    if (settings?.split) {
      await admin.from('split_settings').upsert(
        {
          user_id: user.id,
          split_type: settings.split,
          rotation_pointer: rotation?.pointer ?? 0,
          phase: settings.splitPhase ?? 0,
          // v1 blob has no restSeconds field — use default of 90 seconds
          global_rest_seconds: 90,
        },
        { onConflict: 'user_id' },
      );
    }

    // ------------------------------------------------------------------
    // 4. Templates + template_exercises
    // ------------------------------------------------------------------
    if (templates) {
      for (const [dayLabel, tpl] of Object.entries(templates)) {
        const templateId = await deterministicUuid(user.id, `t-${dayLabel}`);

        await admin.from('templates').upsert(
          {
            id: templateId,
            user_id: user.id,
            day_label: dayLabel,
            name: `${(settings?.split ?? 'ppl').toUpperCase()} - ${dayLabel}`,
          },
          { onConflict: 'id' },
        );

        const exercises = tpl.exercises ?? [];
        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];

          // Normalize name → check alias map → ILIKE lookup → fallback to custom
          const normalizedName = ex.name.toLowerCase().trim();
          const resolvedName = EXERCISE_NAME_ALIASES[normalizedName] ?? ex.name;

          const { data: match } = await admin
            .from('exercises')
            .select('id')
            .ilike('name', resolvedName)
            .limit(1)
            .maybeSingle();

          let exerciseId: string;
          if (match) {
            exerciseId = match.id as string;
          } else {
            // Insert as a custom exercise (is_custom=true, created_by=userId)
            exerciseId = await deterministicUuid(user.id, `custom-ex-${normalizedName}`);
            await admin.from('exercises').upsert(
              {
                id: exerciseId,
                name: ex.name,
                is_custom: true,
                created_by: user.id,
              },
              { onConflict: 'id' },
            );
          }

          const teId = await deterministicUuid(templateId, `te-${i}`);
          await admin.from('template_exercises').upsert(
            {
              id: teId,
              template_id: templateId,
              exercise_id: exerciseId,
              position: i,
              sets: ex.sets,
            },
            { onConflict: 'id' },
          );
        }
      }
    }

    // ------------------------------------------------------------------
    // 5. Sessions + session_sets (v1 history — may be empty array)
    // ------------------------------------------------------------------
    for (let hi = 0; hi < history.length; hi++) {
      const entry = history[hi];
      // Preserve v1 entry.id if it exists (DATA-02); fall back to deterministic UUID
      const sessionId =
        entry.id ??
        (await deterministicUuid(
          user.id,
          `session-${entry.started_at ?? String(hi)}`,
        ));

      await admin.from('sessions').upsert(
        {
          id: sessionId,
          user_id: user.id,
          started_at: entry.started_at ?? null,
          completed_at: entry.completed_at ?? null,
          notes: entry.notes ?? null,
        },
        { onConflict: 'id' },
      );

      const sets = Array.isArray(entry.sets) ? entry.sets : [];
      for (let si = 0; si < sets.length; si++) {
        const set = sets[si];
        const setId = await deterministicUuid(sessionId, `s-${si}`);

        const setWeightRaw = parseWeight(set.weight);
        await admin.from('session_sets').upsert(
          {
            id: setId,
            session_id: sessionId,
            exercise_id: set.exercise_id ?? null,
            set_number: si + 1,
            weight_kg:
              setWeightRaw !== null ? kgFromLbs(setWeightRaw) : null,
            reps: set.reps !== undefined ? parseInt(String(set.reps), 10) : null,
            result: set.result ?? null,
          },
          { onConflict: 'id' },
        );
      }
    }

    // ------------------------------------------------------------------
    // Mark complete
    // ------------------------------------------------------------------
    await admin
      .from('profiles')
      .update({ migration_status: 'complete' })
      .eq('user_id', user.id);

    return new Response(JSON.stringify({ status: 'complete' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Mark failed so the client can show Retry (T-05-D-01 mitigation)
    await admin
      .from('profiles')
      .update({ migration_status: 'failed' })
      .eq('user_id', user.id)
      .catch(() => {
        // If this fails too, we can't recover — log is private (T-05-I-01)
      });

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
