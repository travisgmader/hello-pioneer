import { useEffect, useState } from 'react';
import { supabase } from './auth';

/* ⚠️ LEADER-ONLY module. Imported only from the lazy-loaded leader chunk, which
 * members never download (no link, no navigation to /leader).
 *
 * The sensitive leader data (real names, pastoral notes) is NO LONGER bundled.
 * It lives in the RLS-protected `leader_content` table and is fetched at runtime,
 * so nothing sensitive ships in the client bundle. Only the signed-in leader can
 * read it (RLS gates the row to LEADER_EMAIL). See useLeaderData() below. */

export interface Member {
  id: number;
  name: string;
  age: number;
  church: string;
  lifeStage: string;
  heardVia: string;
  commitment: string;
  committed: boolean;
  deciding: boolean;
  primaryDriver: string;
  spiritualState: string;
  mostUrgent: string;
  focusAreas: string[];
  priorGroup: string;
  inWords: string;
  read: string;
  lead: string;
  watch: string;
}

export interface HotTopic {
  theme: string;
  men: string[];
  count: number;
  weight: string;
}

export interface LeaderData {
  roster: { name: string; age: number | null; status: string }[];
  members: Member[];
  analysis: {
    pattern: string;
    hotTopics: HotTopic[];
    pillars: { n: number; title: string; body: string }[];
    emphasis: string[];
    leadershipMap: { label: string; detail: string }[];
    actionItems: string[];
    composition: { label: string; detail: string }[];
  };
  perWeekNotes: { week: number; notes: string[] }[];
}

/* ---------- Runtime fetch of leader data (RLS-gated to the leader) ---------- */

// Module-level cache so the payload is fetched once per session, no matter how
// many leader pages mount.
let cache: LeaderData | null = null;
let inflight: Promise<LeaderData | null> | null = null;

async function fetchLeaderData(): Promise<LeaderData | null> {
  if (cache) return cache;
  if (!supabase) return null;
  const client = supabase;
  if (!inflight) {
    inflight = (async () => {
      const { data, error } = await client
        .from('leader_content')
        .select('payload')
        .eq('id', 1)
        .maybeSingle();
      if (error || !data) return null;
      cache = data.payload as LeaderData;
      return cache;
    })();
  }
  return inflight;
}

export interface LeaderDataState {
  data: LeaderData | null;
  loading: boolean;
  error: string | null;
}

/** Loads the leader payload from Supabase (cached). Returns loading/error state. */
export function useLeaderData(): LeaderDataState {
  const [data, setData] = useState<LeaderData | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) {
      setData(cache);
      setLoading(false);
      return;
    }
    let active = true;
    fetchLeaderData().then((d) => {
      if (!active) return;
      setData(d);
      setLoading(false);
      if (!d) setError('Could not load leader data. Make sure it has been seeded and you are signed in as the leader.');
    });
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Data-dependent helpers (take the loaded LeaderData) ---------- */

export function getMember(data: LeaderData, id: number): Member | undefined {
  return data.members.find((m) => m.id === id);
}

export function leaderNotesForWeek(data: LeaderData, week: number): string[] {
  return data.perWeekNotes.find((w) => w.week === week)?.notes ?? [];
}

/* ---------- Topic taxonomy: connect weeks to the men they touch ---------- */

export type Tag =
  | 'identity'
  | 'disciplines'
  | 'shame'
  | 'purity'
  | 'brotherhood'
  | 'dating'
  | 'money'
  | 'calling';

export const TAG_LABEL: Record<Tag, string> = {
  identity: 'Identity',
  disciplines: 'Spiritual disciplines',
  shame: 'Failure & shame',
  purity: 'Sexuality & purity',
  brotherhood: 'Brotherhood & loneliness',
  dating: 'Dating & relationships',
  money: 'Money & finances',
  calling: 'Calling & purpose',
};

/** Which themes each week most directly touches. */
export const WEEK_TAGS: Record<number, Tag[]> = {
  1: ['identity'],
  2: ['identity', 'disciplines'],
  3: ['identity', 'shame'],
  4: ['purity'],
  5: ['brotherhood'],
  6: ['brotherhood', 'dating'],
  7: ['money', 'calling'],
  8: ['shame'],
  9: ['shame'],
  10: ['calling', 'brotherhood'],
};

const TAG_PATTERNS: Record<Tag, RegExp> = {
  identity: /identity|who i am/i,
  disciplines: /disciplin|spiritual.*(growth|formation)|\bgrowth\b|accountab/i,
  shame: /shame|past fail/i,
  purity: /purit|sexual|lust|porn/i,
  brotherhood: /brotherhood|loneli|isolation|community/i,
  dating: /dating|relationship|marriage|wife|heartbreak/i,
  money: /money|financ/i,
  calling: /work|calling|purpose|mission/i,
};

/** Tags a given member carries, derived from focus areas + most-urgent + drivers. */
export function memberTags(m: Member): Tag[] {
  const hay = [m.focusAreas.join(' '), m.mostUrgent, m.primaryDriver].join(' ');
  return (Object.keys(TAG_PATTERNS) as Tag[]).filter((t) => TAG_PATTERNS[t].test(hay));
}

export interface WeekMatch {
  member: Member;
  tags: Tag[]; // the overlapping tags between the week and this member
}

/** Men whose stated needs intersect this week's themes — "who to watch this week". */
export function membersForWeek(data: LeaderData, week: number): WeekMatch[] {
  const wtags = WEEK_TAGS[week] ?? [];
  return data.members.map((m) => {
    const overlap = memberTags(m).filter((t) => wtags.includes(t));
    return { member: m, tags: overlap };
  })
    .filter((x) => x.tags.length > 0)
    .sort((a, b) => b.tags.length - a.tags.length);
}

/** At-a-glance flags surfaced across the dashboard. */
export function atRiskMembers(data: LeaderData): Member[] {
  return data.members.filter((m) => /at-risk|highest pastoral|doubting/i.test(`${m.read} ${m.watch}`));
}
export function decidingMembers(data: LeaderData): Member[] {
  return data.members.filter((m) => m.deciding);
}
