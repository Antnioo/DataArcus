// Captures what the Measure Builder writes today for its 8 Ramadan and Eid measures (0.3.2 GM1), for the gulf-calendar
// suite's "the page's output unchanged" check after the builders moved to the shared engine (assets/js/gulf-measures.js).
// Run once, on integration/0.3.2 before the move:   node scripts/tests/capture-gm1-baseline.mjs
// Never re-run it to make a failing check pass: a difference means the page's measures changed.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch } from './lib.mjs';
import { read } from './capture-gulf-baseline.mjs';

const GULF_IDS = ['ramLY', 'ramPct', 'eidFitr', 'eidFitrLY', 'eidFitrPct', 'eidAdha', 'eidAdhaLY', 'eidAdhaPct'];
// the defaults; another calendar, base and home with quotes and brackets in their names (the escaping); Arabic
export const GM1_CONFIGS = [{ pick: GULF_IDS }, { pick: GULF_IDS, cal: "Gulf's Calendar", dateCol: 'Day', base: 'Net ]Sales', fact: 'Sales Lines' },
  { mode: 'existing', existing: 'Revenue', home: 'KPIs', cal: 'Dates', pick: ['eidAdhaPct', 'ramPct', 'mtd'] }];
export const GM1_LANGS = ['en', 'ar'];

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await serve(), browser = await launch();
  const mb = [];
  for (const c of GM1_CONFIGS) for (const lang of GM1_LANGS) mb.push({ saved: c, lang, ...(await read(browser, server.url, '/tools/dax-measure-builder.html', 'dataarcus-measure-builder', c, lang)) });
  await browser.close(); server.close();
  const bad = mb.filter((r) => r.errs.length);
  if (bad.length) { console.error('Page errors:', bad.map((r) => r.errs).flat()); process.exit(1); }
  fs.writeFileSync(path.join(ROOT, 'scripts/tests/fixtures/gulf-calendar/gm1-measures.json'), JSON.stringify({ captured: new Date().toISOString().slice(0, 10), base: 'origin/integration/0.3.2 1691046', mb }, null, 1) + '\n');
  console.log(`Captured ${mb.length} measure builder outputs.`);
}
