// Weekly check of a Microsoft exam's skills outline for the DataArcus practice exam simulators.
// Reads Microsoft's public study guide and certification page, then rewrites
// assets/data/<exam>-outline.json (the simulator shows the "last checked" date from it).
// If Microsoft changed the skills measured, announced a new update date, or mentions
// retirement, it writes review-<exam>.md and exits with an error so GitHub emails you.
// The question bank is NOT changed automatically: new questions need a human review.
// Run locally: node scripts/check-exam-outline.mjs dp-600   (or pl-300)
import fs from 'node:fs';
import crypto from 'node:crypto';

const EXAM = (process.argv[2] || 'dp-600').toLowerCase();   // dp-600 or pl-300
const CODE = EXAM.toUpperCase();
const FILE = 'assets/data/' + EXAM.replace('-', '') + '-outline.json';
const REVIEW = 'review-' + EXAM + '.md';
const cur = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const next = { ...cur };
const problems = [];   // could not read something
const changes = [];    // Microsoft changed something: questions need a look
const UA = { 'user-agent': 'Mozilla/5.0 (DataArcus weekly ' + CODE + ' outline check; +https://dataarcus.com)' };

const decode = (s) => s.replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#8211;|&ndash;/g, '–');
const clean = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const toISO = (s) => { const d = new Date(s + ' UTC'); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); };
const DATE = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/;

// ---------- 1. Study guide: skills measured ----------
try {
  const res = await fetch((EXAM === 'dp-600' && process.env.DP600_STUDY_GUIDE) || cur.sources.studyGuide, { headers: UA });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const html = (await res.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ');

  // The page can hold two versions ("as of" and "prior to"). The newest "as of" date is the one we follow.
  const heads = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => ({ i: m.index, end: m.index + m[0].length, t: clean(m[1]) }));
  const versions = heads.filter((h) => /skills measured/i.test(h.t) && DATE.test(h.t))
    .map((h) => ({ ...h, date: toISO(h.t.match(DATE)[0]), prior: /prior to|before/i.test(h.t) }));
  const latest = versions.filter((v) => !v.prior).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (!latest) throw new Error('no "Skills measured as of <date>" heading found');

  const nextHead = heads.find((h) => h.i > latest.i);
  const section = html.slice(latest.end, nextHead ? nextHead.i : undefined);
  // Keep only the outline itself: sub-headings and bullet points, in order.
  const lines = [...section.matchAll(/<(h3|h4|li)[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => (m[1].toLowerCase() === 'li' ? '- ' : '# ') + clean(m[2])).filter((l) => l.length > 2);
  if (lines.length < 20) throw new Error(`only ${lines.length} outline lines found, the page layout may have changed`);

  const domains = [];
  for (const l of lines) {
    const m = l.match(/^# (.+?)\s*\((\d{1,2})\s*[–-]\s*(\d{1,2})\s*%\)$/);
    if (m && !domains.some((d) => d.name === m[1])) domains.push({ name: m[1], w: `${m[2]}–${m[3]}%` });
  }
  if (domains.length < 2) throw new Error('could not read the skill areas and their weights');
  const hash = crypto.createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);
  console.log('Study guide read:', { outlineDate: latest.date, domains, lines: lines.length, hash });

  next.outlineDate = latest.date;
  next.domains = domains;
  next.outlineHash = hash;
  next.outline = lines;

  // First successful run: trust the outline if its date matches the one the questions were written for.
  if (!cur.bankHash && latest.date === cur.bankOutlineDate) { next.bankHash = hash; console.log('Baseline saved for the question bank.'); }

  if (latest.date !== cur.bankOutlineDate) changes.push(`Microsoft now shows **Skills measured as of ${latest.date}**. The questions were written for ${cur.bankOutlineDate}.`);
  else if (next.bankHash && hash !== next.bankHash) changes.push('The skills list for ' + latest.date + ' was edited since the questions were last reviewed.');
  if (cur.outline && cur.outline.length && hash !== cur.outlineHash) {
    const was = new Set(cur.outline), now = new Set(lines);
    const added = lines.filter((l) => !was.has(l)), removed = cur.outline.filter((l) => !now.has(l));
    if (added.length) changes.push('Added or reworded:\n' + added.map((l) => '  ' + l).join('\n'));
    if (removed.length) changes.push('Removed or reworded:\n' + removed.map((l) => '  ' + l).join('\n'));
  }
} catch (e) {
  problems.push(`Study guide could not be read: ${e.message}`);
}

// ---------- 2. Certification page: announced updates or retirement ----------
try {
  const res = await fetch((EXAM === 'dp-600' && process.env.DP600_CERT_PAGE) || cur.sources.certPage, { headers: UA });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = clean((await res.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' '));
  const upd = text.match(new RegExp('will be updated on (' + DATE.source + ')', 'i'));
  next.announcedUpdate = upd ? toISO(upd[1]) : null;
  if (next.announcedUpdate && next.announcedUpdate > cur.bankOutlineDate) changes.push(`Microsoft announced the next exam update for **${next.announcedUpdate}**.`);
  const ret = text.match(new RegExp('(retir\\w*)[^.]{0,120}?(' + DATE.source + ')', 'i'));
  next.retirement = ret ? toISO(ret[2]) : null;
  if (next.retirement) changes.push(`The certification page mentions retirement on **${next.retirement}**.`);
  console.log('Certification page read:', { announcedUpdate: next.announcedUpdate, retirement: next.retirement });
} catch (e) {
  problems.push(`Certification page could not be read: ${e.message}`);
}

// ---------- save ----------
next.checked = new Date().toISOString().slice(0, 10);
next.status = changes.length ? 'review' : 'current';
fs.writeFileSync(FILE, JSON.stringify(next, null, 2) + '\n');

if (changes.length || problems.length) {
  const body = [
    changes.length ? '## What changed at Microsoft\n\n' + changes.join('\n\n') : '',
    problems.length ? '## What could not be checked\n\n' + problems.map((p) => '- ' + p).join('\n') : '',
    '## What to do\n\n1. Open the [study guide](' + cur.sources.studyGuide + ') and read its Change log table.\n2. Ask Claude to update the ' + CODE + ' question bank for the new outline (upload the repo snapshot).\n3. After the update, set `bankOutlineDate` and `bankHash` in `' + FILE + '` to the new values, and this check turns green again.'
  ].filter(Boolean).join('\n\n');
  if (changes.length) fs.writeFileSync(REVIEW, body + '\n'); // only real changes open an issue
  console.error(body);
  process.exit(1);
}
console.log(CODE + ' outline unchanged. Questions are current.');
