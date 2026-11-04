// 0.3.2 SP27 (the split, finish: model-health-engine.js -> health-rules.js, the rules, and health-confirm.js, the
// "Please confirm" questions; mcp/work/SP27.md): the Model Health Check page, rendered (?lang=en and ?lang=ar), checks
// its sample through its worker and shows a score. The rendered text of every tab, EN and AR, is sp9's suite (its
// records unchanged).
//   W1, W2  EN and AR: the sample is checked through the worker; a score shows, no error
//   W3      (after a move) the page asked for dax-reference-parser, model-index, health-texts, health-rules, health-confirm (the ones
//           that exist), then model-health-engine
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visitor } from './lib.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const NAMES = ['dax-reference-parser', 'model-index', 'health-texts', 'health-rules', 'health-confirm', 'model-health-engine'];

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const want = NAMES.filter((n) => fs.existsSync(path.join(ROOT, 'assets/js', n + '.js')));
  const after = want.includes('health-rules');
  const orders = []; let badOrder = false;
  for (const lang of ['en', 'ar']) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    const asked = [];
    v.ctx.on('request', (r) => { const m = /\/(dax-reference-parser|model-index|health-texts|health-rules|health-confirm|model-health-engine)\.min\.js/.exec(r.url()); if (m) asked.push(m[1]); });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.click('#mhSample');
    await v.pg.waitForSelector('#mhTab, .mh-error', { timeout: 30000 });
    const app = await v.pg.evaluate(() => (document.querySelector('#mhApp') || {}).textContent || '');
    const err = await v.pg.$('.mh-error');
    check(!err && /\d/.test(app) && !v.errs.length, `${lang === 'en' ? 'W1' : 'W2'} ${lang}: the sample is checked through the worker and shows a score: ${err ? 'an error shows' : ''} ${v.errs.join(' | ')}`.trim());
    orders.push(`${lang}: ${asked.join(' ')}`);
    // the page loads the files in order and the worker loads them again in the same order
    const seq = asked.filter((x, i) => asked.indexOf(x) === i);
    if (after && seq.join(' ') !== want.join(' ')) badOrder = true;
    await v.ctx.close();
  }
  if (after) check(!badOrder, `W3 the page must ask for ${want.join(', ')} in that order: ${orders.join(' | ')}`);
  return { checks, problems };
}
