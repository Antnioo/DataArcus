// 0.3.2 SP14 (the split: pbip-bind.js's browser input -> model-import-browser.js; mcp/work/SP14.md): the theme
// generator's own-model choice, rendered (the lab page, the one page with the project card, ?lang=en and ?lang=ar),
// reads the same models and says the same as on the base (integration/0.3.2 29fc44b, before the move). Four choices
// per language, each recorded as the message under the picker, the picker's table groups in order and its select count:
// a project folder (the bridge project with a backup copy of a model in a subfolder, which must lose, and two more
// reports; built in os.tmpdir()), a .pbit read by the Model Health Check's worker (legacy.pbit), a .pbix (refused) and
// a model.bim one byte over 64 MB (a sparse file, refused before it is read); the folder's files in the order of
// their paths. Made-up models only; no data value is read.
// Recorded in fixtures/sp14-import.json; SP14_RECORD=1 records again (only on the base, never to make a run pass).
//   W1-W4  EN: folder, .pbit, .pbix, too big;  W5-W8  AR: the same
//   W9     the page loaded model-import-browser.min.js before pbip-bind.min.js, each once (SP14's move)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visitor } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp14-import.json');
const PAGE = '/tools/power-bi-theme-generator-lab.html';
const REPO = path.join(HERE, '..', '..');

// the files the visitor chooses, made in a temporary folder
function made() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sp14-')), proj = path.join(tmp, 'SP14 Project');
  fs.cpSync(path.join(HERE, 'fixtures', 'bridge-project'), proj, { recursive: true });
  fs.cpSync(path.join(REPO, 'mcp', 'test-models', 'no-measures', 'Plain Orders.SemanticModel'), path.join(proj, 'backup', 'Sales.SemanticModel'), { recursive: true });
  fs.mkdirSync(path.join(proj, 'Second.Report'));
  fs.writeFileSync(path.join(proj, 'Second.Report', 'definition.pbir'), '{"version":"4.0","datasetReference":{"byPath":{"path":"../Sales.SemanticModel"}}}\n');
  fs.writeFileSync(path.join(proj, 'Third.pbip'), '{"version":"1.0","artifacts":[{"report":{"path":"Third.Report"}}]}\n');
  const pbix = path.join(tmp, 'Sales.pbix'); fs.writeFileSync(pbix, 'PK not read');
  const big = path.join(tmp, 'model.bim'); fs.writeFileSync(big, ''); fs.truncateSync(big, 64 * 1024 * 1024 + 1);
  return { tmp, cases: [['folder', 'local', '#pbipFolder', proj], ['pbit', 'service', '#pbipModelFile', path.join(HERE, 'fixtures', 'model-health', 'legacy.pbit')],
    ['pbix', 'service', '#pbipModelFile', pbix], ['too big', 'service', '#pbipModelFile', big]] };
}

// a folder's files in the order of their paths: the browser gives them in the file system's own order, which differs
// between machines (SP8's lesson), and the picker groups its tables in the model's order
const SORTED = () => {
  const files = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
  Object.defineProperty(HTMLInputElement.prototype, 'files', { configurable: true, set(v) { files.set.call(this, v); },
    get() { const f = files.get.call(this); return f && this.webkitdirectory ? Array.from(f).sort((a, b) => (a.webkitRelativePath < b.webkitRelativePath ? -1 : a.webkitRelativePath > b.webkitRelativePath ? 1 : 0)) : f; } });
};

// what the visitor sees of the choice: the message, the picker's table groups and how many choices it offers
const SEEN = () => { const map = document.getElementById('pbipMap'), msg = document.getElementById('pbipOwnMsg');
  return { msg: msg ? msg.textContent : null, bad: msg ? msg.style.color : null, groups: [...new Set([...map.querySelectorAll('optgroup')].map((g) => g.label))], selects: map.querySelectorAll('select').length }; };

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP14_RECORD === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  const loaded = []; let badOrder = false, n = 0;
  const { tmp, cases } = made();
  try {
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser, { viewport: [1440, 900] });
      await v.ctx.addInitScript(SORTED);
      await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
      for (const [id, mode, input, file] of cases) {
        const key = `W${++n} ${lang} ${id}`;
        await v.pg.selectOption('#pbipData', mode);
        await v.pg.evaluate(() => { const m = document.getElementById('pbipOwnMsg'); if (m) m.textContent = ''; });
        await v.pg.setInputFiles(input, file);
        await v.pg.waitForFunction(() => { const t = (document.getElementById('pbipOwnMsg') || {}).textContent || ''; return t && !/Reading the model|جارٍ قراءة النموذج/.test(t); }, null, { timeout: 30000 });
        await v.pg.waitForTimeout(100);
        const now = await v.pg.evaluate(SEEN);
        got[key] = now;
        if (record) continue;
        const g = gold[key] || {};
        check(JSON.stringify(now) === JSON.stringify(g), `${key}: the page shows ${JSON.stringify(now).slice(0, 300)} (recorded ${JSON.stringify(g).slice(0, 300)})`);
      }
      // (W9) the reading scripts in the order the page asked for them (loadBind loads one after the other)
      const order = await v.pg.evaluate(() => performance.getEntriesByType('resource').sort((x, y) => x.startTime - y.startTime).map((x) => x.name).filter((x) => /\/(model-import-browser|pbip-bind)\.min\.js/.test(x)).map((x) => x.replace(/^.*\/([\w-]+)\.min\.js.*$/, '$1')));
      loaded.push(lang + ': ' + order.join(' '));
      if (!(order.length === 2 && order[0] === 'model-import-browser' && order[1] === 'pbip-bind')) badOrder = true;
      if (v.errs.length) problems.push(`${lang}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  if (!record && process.env.SP14_BASE !== '1') check(!badOrder, `W9 the page must load model-import-browser.min.js, then pbip-bind.min.js, once each: ${loaded.join(' | ')}`);
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += Object.keys(got).length; }
  return { checks, problems };
}
