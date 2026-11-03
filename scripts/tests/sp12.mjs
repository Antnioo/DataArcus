// 0.3.2 SP12 (the split: svg-kpi-compiler.js -> svg-expressions.js + svg-escape.js; mcp/work/SP12.md): the SVG KPI
// Designer, rendered (?lang=en and ?lang=ar, 1440 x 900), draws the same canvas and copies the same DAX as on the base
// (integration/0.3.2 a57e094, before the move): every starter (clicked in turn) and 3 made-up adversarial designs put in
// the page's own store (quotes, markup, ]]>, a script tag, javascript:, an Arabic text with RTL marks, a measure name
// with ] and doubled quotes, very long numbers). For each: the canvas SVG (the layers the compiler drew) and the text
// the Copy button hands the clipboard. Recorded in fixtures/sp12-designer.json; SP12_RECORD=1 records again (only on
// the base, never to make a run pass).
//   W1, W2  EN and AR: every design's canvas SVG and copied DAX as recorded; no script ran from a design
//   W3      (after the move) the page loaded svg-escape.min.js and svg-expressions.min.js once, before svg-kpi-compiler
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { visitor, ROOT } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp12-designer.json');
const STARTERS = ['ring', 'trend', 'bar', 'pill', 'spark', 'card', 'ramadan'];
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 24) + ':' + Buffer.byteLength(s, 'utf8');
const moved = ['svg-expressions.js', 'svg-escape.js'].every((f) => fs.existsSync(path.join(ROOT, 'assets/js', f)));

const V = () => [{ id: 'sales', label: 'Sales', kind: 'measure', measure: 'Sales', sample: 1240000 }, { id: 'target', label: 'Target', kind: 'measure', measure: 'Target', sample: 1500000 }, { id: 'ach', label: 'Achievement', kind: 'ratio', a: 'sales', b: 'target' }];
const txt = (o) => Object.assign({ type: 'text', name: 'Text', x: 10, y: 20, size: 12, weight: 400, anchor: 'start', fill: '#111111' }, o);
const ADVERSARIAL = {
  markup: { name: 'KPI "x" <y> ]]>', w: 300, h: 60, values: V(), layers: [txt({ text: 'He said "hi" & \'bye\' <b>x</b> ]]> <script>window.__pwned=1</script> 100% #1' }),
    txt({ y: 40, bind: { text: { v: 'sales', fmt: 'n0', prefix: '<i>"AED"</i> & ', suffix: ' ]]><img src=x onerror="window.__pwned=2">' } } }),
    txt({ y: 55, text: "<a href='javascript:window.__pwned=3'>go</a>", fill: "#000000' onload='window.__pwned=4" })] },
  arabic: { name: '‏مبيعات «رمضان»‎', w: 240, h: 80, mirror: true, values: [{ id: 'sales', label: '‏المبيعات', kind: 'measure', measure: 'المبيعات', sample: 5 }, { id: 'target', label: 'الهدف', kind: 'measure', measure: 'الهدف', sample: 8 }, { id: 'ach', label: 'الإنجاز', kind: 'ratio', a: 'sales', b: 'target' }],
    layers: [txt({ text: '‏المبيعات ‫من‬ الهدف‎ <&>', anchor: 'end', x: 230 }), txt({ y: 50, bind: { text: { v: 'ach', fmt: 'p1', prefix: '‏«', suffix: '»‎' } } }),
      { type: 'ring', name: 'حلقة', cx: 40, cy: 40, r: 30, sw: 6, fill: '#00d4ff', bind: { p: { v: 'ach', d0: 0, d1: 1 } } }] },
  names: { name: 'Net ]] "Sales"', w: 200, h: 40, values: [{ id: 'a', label: 'Net "x"', kind: 'measure', measure: 'Net ]Sales[ "q"', sample: 123456789012345680 }, { id: 'b', label: 'B', kind: 'measure', measure: 'Tgt""', sample: -0.0000001 }, { id: 'c', label: 'C', kind: 'diff', a: 'a', b: 'b' }],
    layers: [txt({ bind: { text: { v: 'c', fmt: 'n2', prefix: 'say ""hi"" ', sign: true } } }), txt({ x: 99999999999.995, y: 30, bind: { text: { v: 'a', fmt: 'auto' } } })] }
};

// the clipboard: what the Copy button writes is kept on the page
const CLIP = () => { try { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { window.__copied = t; return Promise.resolve(); } } }); } catch (e) { /* ignore */ } };

async function one(v) {
  await v.pg.waitForFunction(() => document.querySelector('#stage svg.kd-svg') && document.getElementById('dax').textContent.length > 0, null, { timeout: 30000 });
  await v.pg.evaluate(() => { window.__copied = null; });
  await v.pg.click('#copyBtn');
  await v.pg.waitForFunction(() => window.__copied != null, null, { timeout: 10000 });
  return v.pg.evaluate(() => {
    const s = document.querySelector('#stage svg.kd-svg').cloneNode(true);
    // its width and height are the editor's zoom (the page's width), not the compiler's: the viewBox stays
    s.removeAttribute('width'); s.removeAttribute('height');
    // the editor's own handles and guides are not the compiler's: only the drawn layers and the root's attributes are kept
    [...s.children].forEach((c) => { if (!(c.matches('g[data-l]') || c.matches('rect:first-child') && !c.closest('g'))) c.remove(); });
    return { svg: s.outerHTML, dax: window.__copied, shown: document.getElementById('dax').textContent === window.__copied, pwned: window.__pwned || 0 };
  });
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP12_RECORD === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  const loaded = []; let badOrder = false;

  for (const lang of ['en', 'ar']) {
    const now = {}, bad = [];
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.ctx.addInitScript(CLIP);
    await v.ctx.addInitScript(() => { try { localStorage.setItem('dataarcus-svg-kpi-tour', '{"seen":true}'); } catch (e) { /* ignore */ } });
    await v.pg.goto(`${url}/tools/svg-kpi-designer.html?lang=${lang}`, { waitUntil: 'networkidle' });
    // (W3) the compiler's scripts, in the order the page asked for them
    const order = await v.pg.evaluate(() => performance.getEntriesByType('resource').sort((x, y) => x.startTime - y.startTime).map((x) => x.name).filter((x) => /\/svg-(escape|expressions|kpi-compiler)\.min\.js/.test(x)).map((x) => x.replace(/^.*\/(svg-[\w-]+)\.min\.js.*$/, '$1')));
    loaded.push(lang + ': ' + order.join(' '));
    if (!(order.filter((x) => x === 'svg-escape').length === 1 && order.filter((x) => x === 'svg-expressions').length === 1 && order.indexOf('svg-escape') < order.indexOf('svg-kpi-compiler') && order.indexOf('svg-expressions') < order.indexOf('svg-kpi-compiler'))) badOrder = true;
    for (const id of STARTERS) {
      await v.pg.click(`#starters [data-t="${id}"]`);
      now[id] = await one(v);
    }
    for (const [id, d] of Object.entries(ADVERSARIAL)) {
      await v.pg.evaluate((x) => localStorage.setItem('dataarcus-svg-kpi-v2', JSON.stringify(x)), d);
      await v.pg.reload({ waitUntil: 'networkidle' });
      now['adversarial ' + id] = await one(v);
    }
    if (v.errs.length) bad.push(v.errs.join(' | '));
    await v.ctx.close();
    Object.entries(now).forEach(([k, r]) => { if (!r.shown) bad.push(`${k}: the copied text is not the DAX shown`); if (r.pwned) bad.push(`${k}: a script from the design ran (${r.pwned})`); });
    // the adversarial designs are recorded whole (readable), the starters as sha and length
    got[lang] = Object.fromEntries(Object.entries(now).map(([k, r]) => [k, k.startsWith('adversarial') ? { svg: r.svg, dax: r.dax } : { svg: sha(r.svg), dax: sha(r.dax) }]));
    if (record) continue;
    const g = gold[lang] || {};
    const changed = Object.keys(Object.assign({}, g, got[lang])).filter((k) => JSON.stringify(g[k]) !== JSON.stringify(got[lang][k]));
    if (changed.length) bad.push(`${changed.length} designs differ from the base: ${changed.join(', ')}`);
    check(!bad.length, `${lang === 'en' ? 'W1' : 'W2'} ${lang} designer: ${bad.join('; ')}`);
  }
  if (!record && moved) check(!badOrder, `W3 the page must load svg-escape and svg-expressions once, before svg-kpi-compiler: ${loaded.join(' | ')}`);
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); checks += 2; }
  return { checks, problems };
}
