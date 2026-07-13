/**
 * parse-curriculum.mjs
 * Parses Crown_Season_10Week_Curriculum.html into structured JSON.
 *
 * Source of truth: the semantic HTML classes emitted by the curriculum doc.
 *   .week-break        -> one week
 *   .wk-num-digit      -> week number
 *   .wk-title / .wk-subtitle
 *   .lo-bigidea / .lo-tension        -> overview
 *   .teaching-block    -> tb-title + scripture-pull (scripture-ref + text) + prose
 *   .dq-list li        -> discussion questions
 *   .app-box .app-body -> application challenge
 *   .reading-box .rb-item -> primary reading assignments
 *   .leader-notes      -> EXCLUDED from the member app (pastoral/sensitive)
 *
 * Output: src/data/curriculum.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', '..', 'Crown_Season_10Week_Curriculum.html');
const OUT = join(__dirname, '..', 'src', 'data', 'curriculum.json');

const clean = (s) =>
  (s ?? '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const root = parse(readFileSync(SRC, 'utf8'));

// Series-level metadata
const seriesTitle = 'The Crown Season';
const seriesSubtitle = clean(root.querySelector('.cv-series')?.text) || '';

// Weekly accountability questions (shared across all weeks) — the "as-q" list.
// The doc repeats them; the canonical set is the first four.
const accountabilityQuestions = root
  .querySelectorAll('.as-q')
  .map((n) => clean(n.text))
  .filter(Boolean)
  .slice(0, 4);

const weeks = [];

for (const wk of root.querySelectorAll('.week-break')) {
  const numRaw = clean(wk.querySelector('.wk-num-digit')?.text);
  if (!numRaw) continue; // skip empty/placeholder week-break divs
  const number = parseInt(numRaw, 10);
  if (!Number.isFinite(number)) continue;

  const title = clean(wk.querySelector('.wk-title')?.text);
  const subtitle = clean(wk.querySelector('.wk-subtitle')?.text);
  const bigIdea = clean(wk.querySelector('.lo-bigidea')?.text);

  // Core tension: strip the leading "Core Tension:" label if present.
  let coreTension = clean(wk.querySelector('.lo-tension')?.text);
  coreTension = coreTension.replace(/^Core Tension:\s*/i, '');

  // Opening exercise: the tb-body paragraph immediately after the "Opening" sec-head.
  let opening = '';
  const secHeads = wk.querySelectorAll('.sec-head');
  for (const sh of secHeads) {
    if (/^Opening/i.test(clean(sh.text))) {
      const p = sh.nextElementSibling;
      if (p) opening = clean(p.text);
      break;
    }
  }

  // Teaching blocks: each has a title, optional scripture (ref + text), and prose.
  const teaching = [];
  for (const tb of wk.querySelectorAll('.teaching-block')) {
    const tbTitle = clean(tb.querySelector('.tb-title')?.text);

    const scriptures = [];
    for (const pull of tb.querySelectorAll('.scripture-pull')) {
      const ref = clean(pull.querySelector('.scripture-ref')?.text);
      // Text is the pull content minus the ref span.
      let text = clean(pull.text);
      if (ref && text.startsWith(ref)) text = clean(text.slice(ref.length));
      // Quote-only pulls (no ref) are pull-quotes, not scripture — keep as quote.
      scriptures.push({ ref: ref || null, text });
    }

    // Prose = all <p> children (the explanation/summary), joined.
    const prose = tb
      .querySelectorAll('p')
      .map((p) => clean(p.text))
      .filter(Boolean);

    teaching.push({ title: tbTitle, scriptures, prose });
  }

  // Flat list of scripture references for the week (deduped, in order).
  const scriptureRefs = [];
  for (const t of teaching) {
    for (const s of t.scriptures) {
      if (s.ref && !scriptureRefs.some((x) => x.ref === s.ref)) {
        scriptureRefs.push({ ref: s.ref, text: s.text });
      }
    }
  }

  // Discussion questions
  const discussionQuestions = wk
    .querySelectorAll('.dq-list li')
    .map((li) => clean(li.text))
    .filter(Boolean);

  // Application challenge — preserve simple line breaks as paragraph splits.
  const appBody = wk.querySelector('.app-box .app-body');
  let application = '';
  if (appBody) {
    application = appBody.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/ /g, ' ')
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
  }

  // Primary reading assignments
  const reading = wk
    .querySelectorAll('.reading-box .rb-item')
    .map((n) => clean(n.text))
    .filter(Boolean);

  weeks.push({
    number,
    title,
    subtitle,
    bigIdea,
    coreTension,
    opening,
    teaching,
    scriptureRefs,
    discussionQuestions,
    application,
    reading,
  });
}

weeks.sort((a, b) => a.number - b.number);

const data = {
  seriesTitle,
  seriesSubtitle,
  accountabilityQuestions,
  weeks,
};

writeFileSync(OUT, JSON.stringify(data, null, 2));

// Report
console.log(`Parsed ${weeks.length} weeks -> ${OUT}`);
for (const w of weeks) {
  console.log(
    `  Week ${w.number}: "${w.title}" | ${w.teaching.length} teaching blocks | ` +
      `${w.scriptureRefs.length} scriptures | ${w.discussionQuestions.length} questions | ` +
      `${w.reading.length} readings | app:${w.application ? 'yes' : 'NO'}`
  );
}
