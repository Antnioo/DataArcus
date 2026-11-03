// 0.3.2 SP15 (the split: model-health-engine.js -> model-index.js, the normalised model, its index and dependency
// graph; mcp/work/SP15.md): the Model Health Check page, rendered (?lang=en and ?lang=ar), checks its sample through its
// worker and shows a score. The rendered text of every tab, EN and AR, is sp9's suite (its records unchanged).
//   W1, W2  EN and AR: the sample is checked through the worker; a score shows, no error
//   W3      (after the move) the page asked for dax-reference-parser, then model-index, then model-health-engine
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visitor } from './lib.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const after = fs.existsSync(path.join(ROOT, 'assets/js/model-index.js'));
  const orders = []; let badOrder = false;
  for (const lang of ['en', 'ar']) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    const asked = [];
    v.ctx.on('request', (r) => { const m = /\/(dax-reference-parser|model-index|model-health-engine)\.min\.js/.exec(r.url()); if (m) asked.push(m[1]); });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.click('#mhSample');
    await v.pg.waitForSelector('#mhTab, .mh-error', { timeout: 30000 });
    const app = await v.pg.evaluate(() => (document.querySelector('#mhApp') || {}).textContent || '');
    const err = await v.pg.$('.mh-error');
    check(!err && /\d/.test(app) && !v.errs.length, `${lang === 'en' ? 'W1' : 'W2'} ${lang}: the sample is checked through the worker and shows a score: ${err ? 'an error shows' : ''} ${v.errs.join(' | ')}`.trim());
    orders.push(`${lang}: ${asked.join(' ')}`);
    // the page loads the three (parser, index, engine) and the worker loads them again in the same order
    const seq = asked.filter((x, i) => asked.indexOf(x) === i);
    if (after && seq.join(' ') !== 'dax-reference-parser model-index model-health-engine') badOrder = true;
    await v.ctx.close();
  }
  if (after) check(!badOrder, `W3 the page must ask for dax-reference-parser, then model-index, then model-health-engine: ${orders.join(' | ')}`);
  return { checks, problems };
}
