import raw from '../data/curriculum.json';

/* ---------- Types (mirror curriculum.json) ---------- */

export interface Scripture {
  ref: string | null;
  text: string;
}

export interface TeachingBlock {
  title: string;
  scriptures: Scripture[];
  prose: string[];
}

export interface Week {
  number: number;
  title: string;
  subtitle: string;
  bigIdea: string;
  coreTension: string;
  opening: string;
  teaching: TeachingBlock[];
  scriptureRefs: Scripture[];
  discussionQuestions: string[];
  application: string;
  reading: string[];
}

export interface Curriculum {
  seriesTitle: string;
  seriesSubtitle: string;
  accountabilityQuestions: string[];
  weeks: Week[];
}

export const curriculum = raw as unknown as Curriculum;
export const WEEKS = curriculum.weeks;
export const TOTAL_WEEKS = WEEKS.length;

export function getWeek(n: number): Week | undefined {
  return WEEKS.find((w) => w.number === n);
}

/* ---------- The 3-day rhythm engine ----------
 * Each week's material is spread across three short days so no single
 * sitting is long. The split is content-driven and deterministic:
 *
 *   Day 1 — The Reading   : big idea, the tension, this week's book reading,
 *                           and the first half of the teaching (Scripture + summary).
 *   Day 2 — Go Deeper     : the second half of the teaching, then a reflection.
 *   Day 3 — Prepare to Gather : the discussion questions and the application
 *                           challenge, so a man walks into group ready.
 *
 * Every day also carries a daily check-in (gratitude + a short reflection).
 */

export type BlockKind =
  | 'bigIdea'
  | 'tension'
  | 'opening'
  | 'reading'
  | 'teaching'
  | 'reflection'
  | 'questions'
  | 'application';

export interface DayBlock {
  kind: BlockKind;
  /** Heading shown above the block. */
  label?: string;
  /** Plain-text body (for text blocks). */
  body?: string;
  /** Teaching block payload. */
  teaching?: TeachingBlock;
  /** Reading list / question list payloads. */
  items?: string[];
}

export interface StudyDay {
  week: number;
  day: number; // 1..3
  kind: 'reading' | 'deeper' | 'gather';
  title: string;
  subtitle: string;
  estMinutes: number;
  blocks: DayBlock[];
}

/** Short reflection prompts, rotated by (week, day). Paired with gratitude. */
export const REFLECTION_PROMPTS = [
  'Where did you sense God’s love — or resist it — today?',
  'What is one thing you are carrying that you could hand to the Father right now?',
  'Where did you perform for approval today instead of resting as the beloved?',
  'Who came to mind today that you could reach out to this week?',
  'What lie about yourself surfaced today — and what does God actually say?',
  'Where did you see grace today, in yourself or someone else?',
];

export function reflectionFor(week: number, day: number): string {
  return REFLECTION_PROMPTS[(week + day) % REFLECTION_PROMPTS.length];
}

/* ---------- Weekly memory verse ----------
 * One short, focused verse per week for the men to carry and memorize.
 * Fixed for the whole week (all three days) and shown on every member's
 * dashboard. Curated from each week's anchor Scripture, trimmed to a
 * memorable line. Edit here — this is independent of the parsed curriculum.
 */
export const MEMORY_VERSES: Record<number, Scripture> = {
  1: {
    ref: '1 John 3:1',
    text: '“See what kind of love the Father has given to us, that we should be called children of God; and so we are.”',
  },
  2: {
    ref: 'Proverbs 4:23',
    text: '“Keep your heart with all vigilance, for from it flow the springs of life.”',
  },
  3: {
    ref: 'Psalm 27:10',
    text: '“Though my father and mother forsake me, the LORD will receive me.”',
  },
  4: {
    ref: '1 Corinthians 6:19–20',
    text: '“You are not your own, for you were bought with a price. So glorify God in your body.”',
  },
  5: {
    ref: 'Ecclesiastes 4:9',
    text: '“Two are better than one, because they have a good reward for their toil.”',
  },
  6: {
    ref: 'Proverbs 27:17',
    text: '“Iron sharpens iron, and one man sharpens another.”',
  },
  7: {
    ref: 'Colossians 3:23',
    text: '“Whatever you do, work heartily, as for the Lord and not for men.”',
  },
  8: {
    ref: 'Ephesians 4:26',
    text: '“Be angry and do not sin; do not let the sun go down on your anger.”',
  },
  9: {
    ref: 'Romans 8:1',
    text: '“There is therefore now no condemnation for those who are in Christ Jesus.”',
  },
  10: {
    ref: '2 Timothy 2:2',
    text: '“What you have heard from me entrust to faithful men, who will be able to teach others also.”',
  },
};

export function memoryVerseFor(week: number): Scripture | undefined {
  return MEMORY_VERSES[week];
}

function splitTeaching(teaching: TeachingBlock[]): [TeachingBlock[], TeachingBlock[]] {
  const mid = Math.ceil(teaching.length / 2);
  return [teaching.slice(0, mid), teaching.slice(mid)];
}

/** Build the three study days for a given week. */
export function buildDays(week: Week): StudyDay[] {
  const [firstHalf, secondHalf] = splitTeaching(week.teaching);

  const day1: StudyDay = {
    week: week.number,
    day: 1,
    kind: 'reading',
    title: 'The Reading',
    subtitle: 'Set the foundation for the week',
    estMinutes: 12,
    blocks: [
      { kind: 'bigIdea', label: 'The Big Idea', body: week.bigIdea },
      week.coreTension
        ? { kind: 'tension', label: 'The Tension', body: week.coreTension }
        : null,
      week.reading.length
        ? { kind: 'reading', label: 'Your Reading This Week', items: week.reading }
        : null,
      ...firstHalf.map<DayBlock>((t) => ({ kind: 'teaching', teaching: t })),
    ].filter(Boolean) as DayBlock[],
  };

  const day2: StudyDay = {
    week: week.number,
    day: 2,
    kind: 'deeper',
    title: 'Go Deeper',
    subtitle: 'Sit with the Word',
    estMinutes: 12,
    blocks: [
      ...secondHalf.map<DayBlock>((t) => ({ kind: 'teaching', teaching: t })),
      {
        kind: 'reflection',
        label: 'Reflect',
        body: 'Reread the Scriptures above slowly. Which line lands on you today? Sit with it for two minutes before you move on.',
      },
    ],
  };

  const day3: StudyDay = {
    week: week.number,
    day: 3,
    kind: 'gather',
    title: 'Prepare to Gather',
    subtitle: 'Come to group ready',
    estMinutes: 10,
    blocks: [
      week.opening
        ? { kind: 'opening', label: 'We’ll Open With', body: week.opening }
        : null,
      { kind: 'questions', label: 'Discussion Questions', items: week.discussionQuestions },
      week.application
        ? { kind: 'application', label: 'This Week’s Challenge', body: week.application }
        : null,
    ].filter(Boolean) as DayBlock[],
  };

  return [day1, day2, day3];
}

/** Flat, ordered list of every study day across all weeks. */
export function allDays(): StudyDay[] {
  return WEEKS.flatMap((w) => buildDays(w));
}

export function dayKey(week: number, day: number): string {
  return `${week}-${day}`;
}
