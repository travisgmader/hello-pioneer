/**
 * parse-leader.mjs — LEADER-ONLY data.
 * Parses LEADER-GUIDE.md (member profiles + group analysis) and the per-week
 * leader notes from Crown_Season_10Week_Curriculum.html into src/data/leader.json.
 *
 * ⚠️ This output is sensitive (real names, phone numbers, pastoral disclosures).
 * It is only bundled into the LEADER build (VITE_LEADER=1), never the member build.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUIDE = join(__dirname, '..', '..', 'LEADER-GUIDE.md');
const CURR = join(__dirname, '..', '..', 'Crown_Season_10Week_Curriculum.html');
const OUT = join(__dirname, '..', 'src', 'data', 'leader.json');

const md = readFileSync(GUIDE, 'utf8');

/** Strip markdown emphasis, collapse whitespace. Keep emoji + · separators. */
const clean = (s) =>
  (s ?? '')
    .replace(/\*\*/g, '')
    .replace(/(^|[^*])\*(?!\*)/g, '$1') // lone italic markers
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Body of a section identified by its heading text, up to the next heading. */
function section(headingRegex, level = '###') {
  const lines = md.split('\n');
  const out = [];
  let capturing = false;
  for (const line of lines) {
    if (line.startsWith(level + ' ')) {
      if (capturing) break; // next heading at same level ends the section
      capturing = headingRegex.test(line);
      continue;
    }
    if (capturing && /^##\s/.test(line)) break; // a higher-level heading also ends it
    if (capturing) out.push(line);
  }
  return out.join('\n').trim();
}

/* ---------- Contact roster (table) ---------- */
const roster = [];
{
  const body = section(/Contact Roster/, '##');
  for (const row of body.split('\n')) {
    const m = row.match(/^\|(.+)\|$/);
    if (!m) continue;
    const cells = m[1].split('|').map((c) => clean(c));
    if (cells[0] === 'Name' || /^-+$/.test(cells[0].replace(/[:\s]/g, '-'))) continue;
    if (cells.length < 5) continue;
    // Deliberately omit phone + email — contact PII is never bundled into the app.
    roster.push({ name: cells[0], age: Number(cells[1]) || null, status: cells[4] });
  }
}

/* ---------- Member profiles ---------- */
const members = [];
{
  const part1 = md.slice(md.indexOf('## Part 1'), md.indexOf('## Part 2'));
  const blocks = part1.split(/\n### /).slice(1); // each begins "N. Name — Age NN"
  for (const block of blocks) {
    const lines = block.split('\n');
    const head = lines[0];
    const hm = head.match(/^(\d+)\.\s+(.+?)\s+[—-]\s+Age\s+(\d+)/);
    if (!hm) continue;
    const id = Number(hm[1]);
    const name = clean(hm[2]);
    const age = Number(hm[3]);

    const fields = {};
    const paras = {};
    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (!line) continue;
      const f = line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)$/);
      if (f) {
        fields[clean(f[1])] = clean(f[2]);
        continue;
      }
      const inWords = line.match(/^\*\*In his words:\*\*\s*(.+)$/);
      if (inWords) { paras.inWords = clean(inWords[1]); continue; }
      const read = line.match(/^\*\*Read on [^:]+:\*\*\s*(.+)$/);
      if (read) { paras.read = clean(read[1]); continue; }
      const lead = line.match(/^\*\*Lead him by:\*\*\s*(.+)$/);
      if (lead) { paras.lead = clean(lead[1]); continue; }
      const watch = line.match(/^\*\*Watch:\*\*\s*(.+)$/);
      if (watch) { paras.watch = clean(watch[1]); continue; }
    }

    const commitment = fields['Commitment'] || '';
    const committed = /✅/.test(commitment);
    const deciding = /⚠️|deciding/i.test(commitment);
    const focusAreas = (fields['Focus areas'] || '')
      .split('·')
      .map((s) => clean(s))
      .filter(Boolean);

    // Safety net: scrub any phone/email that might appear inside narrative text.
    const scrub = (s) =>
      (s || '')
        .replace(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '')
        .replace(/[\w.+-]+@[\w.-]+\.\w+/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    members.push({
      id,
      name,
      age,
      church: fields['Church / faith'] || '',
      lifeStage: fields['Life stage'] || '',
      heardVia: fields['Heard via'] || '',
      commitment,
      committed,
      deciding,
      primaryDriver: fields['Primary driver'] || '',
      spiritualState: fields['Spiritual state'] || '',
      mostUrgent: fields['Most urgent'] || '',
      focusAreas,
      priorGroup: fields['Prior group'] || '',
      inWords: scrub(paras.inWords || ''),
      read: scrub(paras.read || ''),
      lead: scrub(paras.lead || ''),
      watch: scrub(paras.watch || ''),
    });
  }
}

/* ---------- Group analysis ---------- */
const pattern = clean(section(/single most important pattern/));

const hotTopics = [];
{
  const body = section(/Where the need clusters/);
  for (const row of body.split('\n')) {
    const m = row.match(/^\|(.+)\|$/);
    if (!m) continue;
    const cells = m[1].split('|').map((c) => clean(c));
    if (cells[0] === 'Theme' || /^-+$/.test(cells[0].replace(/[:\s]/g, '-'))) continue;
    if (cells.length < 4) continue;
    hotTopics.push({
      theme: cells[0],
      men: cells[1].split(',').map((s) => clean(s)).filter(Boolean),
      count: Number(cells[2]) || 0,
      weight: cells[3],
    });
  }
}

function pillarsParse() {
  const body = section(/The three pillars/);
  const out = [];
  const re = /\*\*(\d+)\.\s*(.+?)\*\*\s*([\s\S]*?)(?=\n\*\*\d+\.|\n?$)/g;
  let m;
  while ((m = re.exec(body))) {
    out.push({ n: Number(m[1]), title: clean(m[2]).replace(/\.$/, ''), body: clean(m[3]) });
  }
  return out;
}
const pillars = pillarsParse();

function bullets(body) {
  return body
    .split('\n')
    .filter((l) => /^-\s+/.test(l.trim()))
    .map((l) => clean(l.replace(/^-\s+/, '')))
    .filter(Boolean);
}
function labeledBullets(body) {
  return body
    .split('\n')
    .filter((l) => /^-\s+/.test(l.trim()))
    .map((l) => {
      const t = l.trim().replace(/^-\s+/, '');
      const m = t.match(/^\*\*(.+?):\*\*\s*(.+)$/) || t.match(/^\*\*(.+?)\*\*\s*[—-]\s*(.+)$/);
      if (m) return { label: clean(m[1]), detail: clean(m[2]) };
      return { label: '', detail: clean(t) };
    })
    .filter((x) => x.detail);
}
function numbered(body) {
  return body
    .split('\n')
    .filter((l) => /^\d+\.\s+/.test(l.trim()))
    .map((l) => clean(l.replace(/^\d+\.\s+/, '')))
    .filter(Boolean);
}

const emphasis = bullets(section(/Suggested emphasis/));
const leadershipMap = labeledBullets(section(/Who needs what from you/));
const actionItems = numbered(section(/Action items before week 1/));
const composition = labeledBullets(section(/Group composition at a glance/));

/* ---------- Per-week leader notes (from curriculum HTML) ---------- */
const perWeekNotes = [];
{
  const root = parse(readFileSync(CURR, 'utf8'));
  for (const ln of root.querySelectorAll('.leader-notes')) {
    const label = clean(ln.querySelector('.ln-label')?.text);
    const wm = label.match(/Week\s+(\d+)/i);
    if (!wm) continue;
    const items = ln
      .querySelectorAll('.ln-body li')
      .map((li) => clean(li.text))
      .filter(Boolean);
    perWeekNotes.push({ week: Number(wm[1]), notes: items });
  }
  perWeekNotes.sort((a, b) => a.week - b.week);
}

const data = {
  generatedFrom: 'LEADER-GUIDE.md + Crown_Season_10Week_Curriculum.html',
  roster,
  members,
  analysis: { pattern, hotTopics, pillars, emphasis, leadershipMap, actionItems, composition },
  perWeekNotes,
};

writeFileSync(OUT, JSON.stringify(data, null, 2));

console.log(`Leader data -> ${OUT}`);
console.log(`  roster: ${roster.length} · members: ${members.length} · hotTopics: ${hotTopics.length} · pillars: ${pillars.length}`);
console.log(`  emphasis: ${emphasis.length} · leadershipMap: ${leadershipMap.length} · actionItems: ${actionItems.length} · composition: ${composition.length}`);
console.log(`  perWeekNotes: ${perWeekNotes.length} weeks`);
for (const m of members) {
  console.log(`   #${m.id} ${m.name} (${m.age}) ${m.committed ? '✅' : m.deciding ? '⚠️' : '?'} focus:${m.focusAreas.length}`);
}
