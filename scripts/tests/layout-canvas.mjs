// 0.3.1 LC1 (the owner, 27 Oct, D-1027-19 "Both A", SQ13-S2; D-1027-12: the previews match what is written;
// mcp/work/LC1.md; written red first): the Theme Generator's layout canvas (lab page, where the project download is)
// draws page 1 as the download writes it, after the writer's fit (the filter rail as high as its slicers and Reset,
// the slots under it taking its column), not the layout's slots before it.
//   C1 every panel the canvas draws equals a box (x, y, width, height) of a visual or group on the written page 1 (a
//      table the writer shortened to its rows: at the slot's corner, as wide, no higher):
//      EN and AR, 1280 x 720 and 1920 x 1080, the rail at the start, at the top and none, plain and glass
//   C2 the rail is drawn as high as the written rail (it was the page's full height)
//   C3 the cost per move: a slider drag redraws the canvas with the fit in a few ms (said in the result)
//   N1 (TT2's Seen 3) at 390 wide the floating WhatsApp button never covers the names list's last row or its button
//      when they are scrolled to the screen's bottom or reached by Tab (AR, the list); EN the project card's button
// Made-up models only (a model.bim in a temp folder), no employer data.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { visitor } from './lib.mjs';

const PAGE = '/tools/power-bi-theme-generator-lab.html', STORE = 'dataarcus-theme-generator';

function unzip(buf) {
  const out = {}; let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const size = buf.readUInt32LE(p + 18), nlen = buf.readUInt16LE(p + 26), xlen = buf.readUInt16LE(p + 28);
    const name = buf.toString('utf8', p + 30, p + 30 + nlen), start = p + 30 + nlen + xlen;
    out[name] = buf.subarray(start, start + size); p = start + size;
  }
  return out;
}
// the boxes of page 1's visuals and groups, in page units (a visual in a group: the group's position added)
function pageOneBoxes(files) {
  const order = Object.keys(files).find((n) => /\/definition\/pages\/pages\.json$/.test(n));
  const first = JSON.parse(files[order].toString('utf8')).pageOrder[0], dir = order.replace(/pages\.json$/, first + '/visuals/');
  const vs = Object.keys(files).filter((n) => n.startsWith(dir) && n.endsWith('/visual.json')).map((n) => JSON.parse(files[n].toString('utf8')));
  const by = Object.fromEntries(vs.map((v) => [v.name, v]));
  return vs.map((v) => { const g = v.parentGroupName ? by[v.parentGroupName].position : { x: 0, y: 0 };
    return { kind: v.visual ? v.visual.visualType : 'group', x: Math.round(v.position.x + g.x), y: Math.round(v.position.y + g.y), w: Math.round(v.position.width), h: Math.round(v.position.height) }; });
}
// the panels the canvas draws (rects with corners: not the accent bars, header lines or hover outlines), in page units
const canvasPanels = (pg) => pg.evaluate(() => {
  const svg = document.querySelector('#layCanvas svg'), E = window.DAEngine, st = JSON.parse(localStorage.getItem('dataarcus-theme-generator'));
  const s = E.page(st.layout).s, n = (e, a) => +(e.getAttribute(a) || 0);
  return [...svg.querySelectorAll('rect[rx]')].filter((r) => !r.classList.contains('kb') && !r.classList.contains('hl') && !r.classList.contains('o') && !r.closest('[data-s]'))
    .map((r) => ({ x: Math.round(n(r, 'x') * s), y: Math.round(n(r, 'y') * s), w: Math.round((n(r, 'x') + n(r, 'width')) * s) - Math.round(n(r, 'x') * s), h: Math.round((n(r, 'y') + n(r, 'height')) * s) - Math.round(n(r, 'y') * s) }));
});

export default async function ({ browser, url }) {
  let checks = 0; const problems = [], said = [];
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lc1-'));
  const open = async (lang, layout, look, viewport) => {
    const v = await visitor(browser, { viewport: viewport || [1440, 900], downloads: true });
    await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.evaluate(([k, layout, look]) => { const s = JSON.parse(localStorage.getItem(k) || '{}'); s.name = 'Shop';
      s.layout = Object.assign({ v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', headLine: 'full', samples: false, transparent: true, preset: 'exec', kpis: 4 }, layout);
      s.chart = Object.assign({}, s.chart, { look }); localStorage.setItem(k, JSON.stringify(s)); }, [STORE, layout, look]);
    await v.pg.reload({ waitUntil: 'networkidle' });
    // the writer loads once after the first draw (on the old code it never does: the canvas is the plan's)
    await v.pg.waitForFunction(() => window.DAPbip && document.querySelector('#layCanvas svg[data-fit]'), null, { timeout: 8000 }).catch(() => {});
    return v;
  };
  const download = async (pg) => {
    const dl = pg.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    await pg.click('#pbipBtn'); const d = await dl;
    return d ? unzip(fs.readFileSync(await d.path())) : null;
  };

  // C1, C2
  const RAILS = { start: { filters: true, fpos: 'start' }, top: { filters: true, fpos: 'top' }, none: { filters: false } };
  for (const lang of ['en', 'ar']) for (const page of ['1280x720', '1920x1080']) for (const rail of Object.keys(RAILS)) for (const look of ['auto', 'glass']) {
    if (look === 'glass' && rail === 'top') continue;   // the top rail's fit is the same in both looks: its plain cases cover it
    const id = `${lang} ${page} rail ${rail} ${look === 'glass' ? 'glass' : 'plain'}`;
    const v = await open(lang, Object.assign({ page, dir: lang === 'ar' ? 'rtl' : 'ltr' }, RAILS[rail]), look);
    const drawn = await canvasPanels(v.pg), files = await download(v.pg);
    const written = files ? pageOneBoxes(files) : [];
    // (a table's panel is its slot; the writer may write the table itself shorter, to the rows it shows: its tableSmaller.
    // Then its box starts at the slot's corner, as wide, no higher)
    const off = drawn.filter((b) => !written.some((w) => w.x === b.x && w.y === b.y && w.w === b.w && (w.h === b.h || (w.kind === 'tableEx' && w.h <= b.h))));
    check(files && drawn.length >= 6 && !off.length, `C1 (${id}): the canvas draws panels that are no box of the written page 1: ${JSON.stringify(off)} (written ${JSON.stringify(written.map((w) => [w.kind, w.x, w.y, w.w, w.h]))})`);
    if (rail === 'start') {
      const r = written.find((w) => w.kind === 'group' && drawn.some((b) => b.x === w.x && b.y === w.y && b.w === w.w && b.h === w.h) && w.h > w.w);
      const pageH = +page.split('x')[1];
      check(r && r.h < pageH / 2, `C2 (${id}): the rail drawn as the written one, as high as its slicers and Reset (${r ? r.w + ' x ' + r.h : 'no rail drawn as written'})`);
    }
    await v.ctx.close();
  }

  // C3: the cost per move (a slider drag: 20 moves of the KPI height slider), with the fit
  {
    const v = await open('en', { page: '1920x1080', filters: true, fpos: 'start' }, 'auto');
    await v.pg.evaluate(() => { document.querySelector('.tg-adv') && (document.querySelector('.tg-adv').open = true); });
    const t = await v.pg.evaluate(() => {
      const el = document.querySelector('#layControls input[type="range"][data-l]'); if (!el) return null;
      const lo = +el.min, hi = +el.max, ms = [];
      for (let i = 0; i < 20; i++) { el.value = String(lo + (hi - lo) * (i % 10) / 10); const t0 = performance.now(); el.dispatchEvent(new Event('input', { bubbles: true })); ms.push(performance.now() - t0); }
      ms.sort((a, b) => a - b);
      return { key: el.dataset.l, median: +ms[10].toFixed(1), max: +ms[19].toFixed(1), fit: !!document.querySelector('#layCanvas svg[data-fit]') };
    });
    said.push(`per move ${t ? t.key + ' median ' + t.median + ' ms, max ' + t.max + ' ms' : 'no slider'}`);
    check(t && t.fit && t.median < 50, `C3: a slider move redraws the canvas with the fit, under 50 ms (${JSON.stringify(t)})`);
    await v.ctx.close();
  }

  // N1: the WhatsApp button at 390 wide (TT2's Seen 3)
  {
    const dir = path.join(tmp, 'Own', 'Own.SemanticModel'); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'definition.pbism'), '{ "version": "4.0", "settings": {} }');
    const cols = (xs) => xs.map(([name, dataType]) => ({ name, dataType }));
    fs.writeFileSync(path.join(dir, 'model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
      { name: 'Sales', columns: cols([['Amount', 'double'], ['Cost', 'double'], ['Qty', 'double'], ['Customer', 'string'], ['Territory', 'string'], ['Order Date', 'dateTime']]),
        measures: [['Total Sales', 'SUM ( Sales[Amount] )'], ['Orders', 'COUNTROWS ( Sales )'], ['Total Cost', 'SUM ( Sales[Cost] )'], ['Units', 'SUM ( Sales[Qty] )']].map(([name, expression]) => ({ name, expression, formatString: '#,0' })) },
      { name: 'Calendar', dataCategory: 'Time', columns: [{ name: 'Date', dataType: 'dateTime', isKey: true }, { name: 'Month', dataType: 'string', sortByColumn: 'Month Number' }, { name: 'Month Number', dataType: 'int64' }] }],
    relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
    // the button's box against each target's, once the target is scrolled to the screen's bottom, and once it is focused
    const clear = (pg, sel) => pg.evaluate(async (sel) => {
      const wa = document.querySelector('.wa-float'), els = sel.map((q) => [...document.querySelectorAll(q)].pop()).filter(Boolean); if (!wa || els.length < sel.length) return { none: true, wa: !!wa, n: els.length };
      document.documentElement.style.scrollBehavior = 'auto';   // (the site scrolls smoothly: where it ends is what counts)
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom, out = [];
      for (const e of els) {
        for (const how of ['scroll', 'focus']) {
          // (instant: the site scrolls smoothly, and a smooth scroll would still be on its way)
          window.scrollTo({ top: 0, behavior: 'instant' });
          if (how === 'scroll') e.scrollIntoView({ block: 'end', behavior: 'instant' }); else (e.matches('input, button') ? e : e.querySelector('input, button') || e).focus();
          await new Promise((r) => setTimeout(r, 300));
          const a = wa.getBoundingClientRect(), b = e.getBoundingClientRect();
          if (b.bottom < 0 || b.top > innerHeight) out.push(how + ' ' + (e.getAttribute('data-name-key') || e.id) + ' not on the screen');
          else if (hit(a, b)) out.push(how + ' ' + (e.getAttribute('data-name-key') || e.id));
        }
      }
      return { covered: out, n: els.length };
    }, sel);
    const ar = await visitor(browser, { viewport: [390, 844], downloads: true });
    await ar.pg.goto(`${url}${PAGE}?lang=ar`, { waitUntil: 'networkidle' });
    await ar.pg.selectOption('#pbipData', 'local'); await ar.pg.setInputFiles('#pbipFolder', path.join(tmp, 'Own'));
    await ar.pg.waitForFunction(() => document.querySelectorAll('#pbipMap select').length > 0 && !/جارٍ قراءة النموذج/.test((document.getElementById('pbipOwnMsg') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => {});
    await ar.pg.click('#pbipBtn').catch(() => {});
    await ar.pg.waitForFunction(() => { const b = document.getElementById('pbipNames'); return b && !b.hidden; }, null, { timeout: 15000 }).catch(() => {});
    const r1 = await clear(ar.pg, ['#pbipNames [data-name-key]', '#pbipNamesOk']);
    check(!r1.none && r1.n === 2 && !r1.covered.length, `N1 (ar, 390): the WhatsApp button covers the names list's last row or its button: ${JSON.stringify(r1)}`);
    await ar.ctx.close();
    const en = await visitor(browser, { viewport: [390, 844], downloads: true });
    await en.pg.goto(`${url}${PAGE}?lang=en`, { waitUntil: 'networkidle' });
    const r2 = await clear(en.pg, ['#pbipBtn']);
    check(!r2.none && !r2.covered.length, `N1 (en, 390): the WhatsApp button covers the project card's download button: ${JSON.stringify(r2)}`);
    await en.ctx.close();
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (said.length) console.log('layout-canvas: ' + said.join('; '));
  return { checks, problems };
}
