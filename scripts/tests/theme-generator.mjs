// Power BI Theme & Layout Generator: saved-design upgrades, accent bars and corners, chart style,
// page sizes, the theme JSON, the download reminders, and the example.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { visitor, settle } from './lib.mjs';
const { PNG } = createRequire(import.meta.url)('pngjs');

const PAGE = '/tools/power-bi-theme-generator.html';
const STORE = 'dataarcus-theme-generator';

// geometry of the preview: bars inside their card, KPI text clear of a side bar, header line inside the header
const geometry = () => {
  const svg = document.querySelector('#layCanvas svg'), n = (e, a) => +(e.getAttribute(a) || 0);
  const rects = [...svg.querySelectorAll('rect')], cards = rects.filter((r) => r.getAttribute('rx') !== null && !r.classList.contains('kb') && !r.classList.contains('hl') && !r.classList.contains('o'));
  const bad = [], kb = [...svg.querySelectorAll('rect.kb')], hl = [...svg.querySelectorAll('rect.hl')], hh = n(rects[1], 'height');
  kb.forEach((r) => {
    const x = n(r, 'x'), y = n(r, 'y'), w = n(r, 'width'), h = n(r, 'height');
    const card = cards.find((c) => x >= n(c, 'x') - 0.01 && y >= n(c, 'y') - 0.01 && x + w <= n(c, 'x') + n(c, 'width') + 0.01 && y + h <= n(c, 'y') + n(c, 'height') + 0.01);
    if (!card) { bad.push('bar outside card'); return; }
    if (!r.getAttribute('clip-path')) [...svg.querySelectorAll('text')].filter((t) => { const tx = n(t, 'x'), ty = n(t, 'y'); return ty > n(card, 'y') && ty < n(card, 'y') + n(card, 'height') && tx > n(card, 'x') && tx < n(card, 'x') + n(card, 'width') && t.getAttribute('font-family') !== 'Consolas, monospace'; })
      .forEach((t) => { const tx = n(t, 'x'), end = t.getAttribute('text-anchor') === 'end'; if (end ? tx > x - 6 : tx < x + w + 6) bad.push('text on bar: ' + t.textContent); });
  });
  hl.forEach((r) => { if (n(r, 'y') < 0 || n(r, 'y') + n(r, 'height') > hh + 0.01) bad.push('header line outside header'); });
  return { kb: kb.length, hl: hl.length, bad };
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const open = async (lang, opts = {}) => {
    const v = await visitor(browser, { downloads: true, ...opts });
    await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
    return v;
  };
  const saved = (pg) => pg.evaluate((k) => JSON.parse(localStorage.getItem(k)).layout, STORE);
  const active = (pg, k) => pg.evaluate((k) => document.querySelector(`button[data-l="${k}"].active`)?.dataset.v, k);

  // 1. Saved designs from older versions open the way they were made
  let v = await open('en');
  check(await active(v.pg, 'page') === '1920x1080', 'new visitor: page size is not 1920 x 1080');
  // keep a real saved design and put an old-style layout in it
  const oldLayout = (layout) => v.pg.evaluate(([k, layout]) => { const d = JSON.parse(localStorage.getItem(k)); d.layout = layout; localStorage.setItem(k, JSON.stringify(d)); }, [STORE, layout]);
  await oldLayout({ preset: 'exec', kpis: 4, radius: 12, accentBar: false, header: true });
  await v.pg.reload({ waitUntil: 'networkidle' });
  let l = await saved(v.pg);
  check(l.radius === 8 && l.kpiBar === 'none' && l.page === '1280x720' && !('accentBar' in l), `old design (Soft, bar off) upgraded wrongly: ${JSON.stringify(l)}`);
  await oldLayout({ preset: 'exec', kpis: 4, radius: 14, header: true });
  await v.pg.reload({ waitUntil: 'networkidle' });
  l = await saved(v.pg);
  check(l.radius === 16 && l.kpiBar === 'start' && l.headLine === 'short', `old design (Round) upgraded wrongly: ${JSON.stringify(l)}`);
  await v.ctx.close();

  // 2. Accent bars and corners across page sizes, directions, KPI counts and thicknesses
  for (const lang of ['en', 'ar']) {
    v = await open(lang);
    await v.pg.evaluate(() => { document.querySelector('.tg-adv').open = true; });
    for (const size of ['1280x720', '1920x1080', '960x720']) {
      await v.pg.click(`[data-l=page][data-v="${size}"]`);
      for (const dir of ['ltr', 'rtl']) {
        await v.pg.click(`[data-l=dir][data-v=${dir}]`);
        for (const kpis of [3, 6]) {
          await v.pg.click(`[data-l=kpis][data-v="${kpis}"]`);
          for (const bar of ['start', 'top', 'bottom', 'none']) {
            await v.pg.click(`[data-l=kpiBar][data-v=${bar}]`);
            for (const head of ['short', 'full', 'none']) {
              await v.pg.click(`[data-l=headLine][data-v=${head}]`);
              for (const t of [2, 8]) {
                for (const k of ['kpiBarW', 'headLineW']) await v.pg.evaluate(([k, t]) => { const el = document.querySelector(`input[data-l=${k}]`); if (el) { el.value = Math.round(t * el.dataset.f); el.dispatchEvent(new Event('input', { bubbles: true })); } }, [k, t]);
                const r = await v.pg.evaluate(geometry);
                check(r.kb === (bar === 'none' ? 0 : kpis) && r.hl === (head === 'none' ? 0 : 1) && !r.bad.length, `${lang} ${size} ${dir} ${kpis} KPIs bar=${bar} line=${head} t=${t}: ${JSON.stringify(r)}`);
              }
            }
          }
        }
      }
    }
    // the exact corner slider keeps the buttons in step; Advanced stays open after a rebuild
    await v.pg.click('[data-l=kpiBar][data-v=start]'); await v.pg.click('[data-l=kpiBarC][data-v=data]');
    const adv = await v.pg.evaluate(() => { const o = document.querySelector('.tg-adv').open, el = document.querySelector('input[data-l=radius]'); el.value = Math.round(16 * el.dataset.f); el.dispatchEvent(new Event('input', { bubbles: true })); return o && document.querySelector('button[data-l=radius][data-v="16"]').classList.contains('active'); });
    check(adv, `${lang}: Advanced closed after a rebuild, or radius slider not in step with the buttons`);
    if (v.errs.length) problems.push(`${lang}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // 3. The theme JSON carries the corner radius in page units, and transparent visuals when chosen
  v = await open('en');
  const json = () => v.pg.evaluate(() => JSON.parse(document.getElementById('json').textContent));
  for (const [size, r, want] of [['1280x720', '16', 16], ['1920x1080', '16', 24], ['1920x1080', '8', 12], ['960x720', '0', 0]]) {
    await v.pg.click(`[data-l=page][data-v="${size}"]`); await v.pg.click(`[data-l=radius][data-v="${r}"]`);
    // every visual (*) and every visual type, since Power BI's base theme sets corners per type;
    // Power BI only rounds a visual with its border on, so solid visuals get a 1px border in their own background color
    const T = await json(), vs = T.visualStyles, types = Object.keys(vs).filter((k) => k !== 'page');
    const borders = [...new Set(types.map((k) => JSON.stringify(vs[k]['*'].border[0])))];
    const want2 = JSON.stringify({ show: true, color: { solid: { color: T.background } }, width: 1, radius: want });
    check(types.length > 40 && borders.length === 1 && borders[0] === want2, `${size} radius ${r}: borders ${borders.join(' / ')} on ${types.length} visual types, expected ${want2}`);
  }
  await v.pg.click('#dlVis [data-l=transparent][data-v="1"]');
  const tj = await json();
  check(tj.visualStyles['*']['*'].background[0].show === false, 'Transparent choice not in the theme JSON');
  check(Object.keys(tj.visualStyles).filter((k) => k !== 'page').every((k) => tj.visualStyles[k]['*'].border[0].show === false), 'Transparent visuals should have no border');
  // Power BI's own square shadow: never with transparent visuals (the PNG draws the shadows); solid follows Soft shadows
  const shadows = (T) => [...new Set(Object.keys(T.visualStyles).filter((k) => k !== 'page').map((k) => T.visualStyles[k]['*'].dropShadow[0].show))].join();
  check(shadows(tj) === 'false', `Transparent visuals should have Power BI's shadow off (got ${shadows(tj)})`);
  await v.pg.click('#dlVis [data-l=transparent][data-v="0"]');
  const setShadow = async (on) => { const cb = await v.pg.$('input[data-l=shadow]'); if ((await cb.isChecked()) !== on) await cb.click(); };
  await setShadow(true); check(shadows(await json()) === 'true', 'Solid visuals with Soft shadows on should keep a shadow');
  await setShadow(false); check(shadows(await json()) === 'false', 'Solid visuals with Soft shadows off should have no shadow');
  await v.pg.click('#dlVis [data-l=transparent][data-v="1"]');
  // custom page size, including a value out of range
  await v.pg.click('[data-l=page][data-v=custom]');
  await v.pg.fill('input[data-l=pageW]', '5000'); await v.pg.press('input[data-l=pageW]', 'Tab');
  const msg = await v.pg.evaluate(() => document.querySelector('#pageSize [role=status]')?.textContent || '');
  check(/3840/.test(msg), `custom width 5000 not limited to 3840 with a message (${msg})`);
  await v.ctx.close();

  // 4. Downloads: three files, reminders when they go out of date, the solid-visuals hint
  for (const lang of ['en', 'ar']) {
    v = await open(lang);
    const dl = async (sel) => { const [d] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click(sel)]); return d.suggestedFilename(); };
    const st = () => v.pg.evaluate(() => ({ notes: [...document.querySelectorAll('#dlStatus .tg-note')].map((n) => n.querySelector('button').dataset.dl),
      stale: [...document.querySelectorAll('.tg-file.stale')].map((f) => f.dataset.file), dot: !!document.querySelector('.tg-steps a.stale') }));
    check((await dl('#dlBtn')).endsWith('.json'), `${lang}: theme download is not a .json`);
    check((await dl('#pngBtn')).endsWith('.png'), `${lang}: background download is not a .png`);
    check((await dl('#slotCsv')).endsWith('.csv'), `${lang}: table download is not a .csv`);
    let s = await st();
    check(s.notes.join() === 'transparent' && !s.stale.length, `${lang}: after downloading all three with solid visuals: ${JSON.stringify(s)}`);
    await v.pg.click('[data-l=radius][data-v="16"]');           // changes theme + background, not the table
    s = await st();
    check(s.stale.join() === 'json,png' && s.notes.includes('stale') && s.dot, `${lang}: after changing corners: ${JSON.stringify(s)}`);
    await v.pg.click('[data-l=kpis][data-v="6"]');                // changes the table too
    s = await st();
    check(s.stale.join() === 'json,png,csv', `${lang}: after changing KPI count: ${JSON.stringify(s)}`);
    await v.pg.click('#dlStatus [data-dl=transparent]');
    s = await st();
    check(!s.notes.includes('transparent'), `${lang}: Switch to transparent did not clear the hint`);
    const names = []; v.pg.on('download', (d) => names.push(d.suggestedFilename()));
    await v.pg.click('#dlStatus [data-dl=stale]'); await v.pg.waitForTimeout(1500);
    s = await st();
    check(names.length === 3 && !s.notes.length && !s.stale.length && !s.dot, `${lang}: Download these again got ${names.join(', ')}; left ${JSON.stringify(s)}`);
    if (v.errs.length) problems.push(`${lang}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // 5. The downloaded PNG matches the table to the pixel: each panel's outer edge sits exactly at the table's X / Y
  //    (confirmed in Power BI with calibration backgrounds at 1920 × 1080 and 1280 × 720, Image fit: Stretch)
  for (const size of ['1920x1080', '1280x720']) {
    v = await open('en');
    await v.pg.click('[data-p="Midnight"]'); await v.pg.click(`[data-l=page][data-v="${size}"]`); await v.pg.click('[data-l=radius][data-v="0"]');
    await v.pg.click('[data-l=kpiBar][data-v=none]');
    const cb = await v.pg.$('input[data-l=shadow]'); if (!(await cb.isChecked())) await cb.click(); // dark + shadow: no outline, crisp panel edge
    const rows = await v.pg.evaluate(() => [...document.querySelectorAll('#slotTable tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)));
    const [d] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#pngBtn')]);
    const png = PNG.sync.read(fs.readFileSync(await d.path())), k = png.width / +size.split('x')[0];
    const c = (x, y) => { const i = (png.width * y + x) * 4; return png.data.slice(i, i + 3).join(); };
    for (const r of rows.filter((r) => /^(KPI 1|Comparison)$/.test(r[0]))) {
      const [x, y, w, h] = r.slice(2).map(Number), mx = Math.round((x + w / 2) * k), my = Math.round((y + h / 2) * k), fill = c(mx, my);
      let top = my; while (top > 0 && c(mx, top - 1) === fill) top--;
      let left = mx; while (left > 0 && c(left - 1, my) === fill) left--;
      const got = [left / k, top / k].map((n) => Math.round(n)), want = [x, y];
      check(Math.abs(got[0] - want[0]) <= 0.5 && Math.abs(got[1] - want[1]) <= 0.5, `${size} ${r[0]}: PNG panel starts at ${got.join(', ')}, expected ${want.join(', ')} (table ${x}, ${y})`);
    }
    await v.ctx.close();
  }

  // 6. The example: loads, scrolls to the layout, Undo restores the visitor's own design exactly
  for (const lang of ['en', 'ar']) {
    v = await open(lang);
    await v.pg.click('[data-p="Midnight"]'); await v.pg.click('[data-l=preset][data-v=ops]');
    const mine = await v.pg.evaluate((k) => localStorage.getItem(k), STORE);
    const pic = await v.pg.evaluate(() => document.getElementById('exampleImg').naturalWidth);
    check(pic > 0, `${lang}: example picture did not load`);
    await v.pg.click('#exampleBtn'); await settle(v.pg);
    const ex = await v.pg.evaluate(() => ({ preset: document.querySelector('.tg-preset.active')?.textContent, undo: !document.getElementById('exampleUndo').hidden,
      top: Math.round(document.getElementById('layout').getBoundingClientRect().top), bars: Math.round(document.getElementById('tgSteps').getBoundingClientRect().bottom) }));
    check(ex.undo && ex.top >= ex.bars - 1, `${lang}: example ${JSON.stringify(ex)}`);
    await v.pg.click('#exampleUndo');
    check(await v.pg.evaluate((k) => localStorage.getItem(k), STORE) === mine, `${lang}: Undo did not restore the design exactly`);
    if (v.errs.length) problems.push(`${lang}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  // 7. Chart style: "Power BI default" writes nothing; each choice lands only on visual types whose theme schema
  //    (2.157) has that setting, because one unknown property makes Power BI reject the whole theme.
  //    Lists below are copied from the schema, independent of the generator's own lists.
  {
    const CART = ['barChart', 'columnChart', 'clusteredBarChart', 'clusteredColumnChart', 'hundredPercentStackedBarChart', 'hundredPercentStackedColumnChart', 'lineChart',
      'areaChart', 'stackedAreaChart', 'hundredPercentStackedAreaChart', 'lineStackedColumnComboChart', 'lineClusteredColumnComboChart', 'ribbonChart'];
    const LABELS = [...CART, 'waterfallChart', 'funnel', 'pieChart', 'donutChart', 'treemap', 'filledMap', 'azureMap', 'gauge'];
    const LEGEND = [...CART, 'waterfallChart', 'scatterChart', 'pieChart', 'donutChart', 'treemap', 'map', 'filledMap', 'shapeMap', 'azureMap'];
    const ALLOWED = {
      labels: [LABELS, ['show']], legend: [LEGEND, ['show', 'position']],
      valueAxis: [[...CART, 'waterfallChart', 'scatterChart'], ['gridlineShow', 'gridlineStyle', 'gridlineColor', 'showAxisTitle']],
      categoryAxis: [[...CART, 'scatterChart'], ['gridlineShow', 'showAxisTitle']], categoryAxisTitle: [[...CART, 'waterfallChart', 'scatterChart'], ['showAxisTitle']],
      grid: [['tableEx', 'pivotTable'], ['gridVertical', 'gridHorizontal', 'gridHorizontalColor']],
      values: [['tableEx', 'pivotTable'], ['fontSize', 'backColorPrimary', 'backColorSecondary']]
    };
    const CARDS = ['labels', 'legend', 'valueAxis', 'categoryAxis', 'grid'];
    v = await open('en');
    const sel = async (c) => { for (const [i, id] of ['csLabels', 'csGrid', 'csLegend', 'csAxis', 'csTable'].entries()) await v.pg.selectOption('#' + id, c[i]); };
    const theme = () => v.pg.evaluate(() => JSON.parse(document.getElementById('json').textContent).visualStyles);
    const auto = await theme();
    // text sizes already use some of these cards (the card visual's labels), so only what differs from "default" counts
    const added = (t, card, o) => Object.keys(o).filter((k) => JSON.stringify(auto[t]?.['*'][card]?.[0]?.[k]) !== JSON.stringify(o[k]));
    check(Object.entries(auto).every(([t, s]) => CARDS.every((c) => !s['*'][c] || t === 'card')), 'Chart style on "Power BI default" still writes chart settings');
    for (const c of [['on', 'dotted', 'TopCenter', 'off', 'minimal'], ['off', 'off', 'off', 'auto', 'banded'], ['on', 'off', 'Right', 'off', 'auto']]) {
      const vs = await theme(), tag = `chart style ${c.join('/')}`;
      await sel(c);
      const got = await theme();
      for (const [t, s] of Object.entries(got)) for (const [card, arr] of Object.entries(s['*'])) {
        const keys = [...CARDS, 'values'].includes(card) ? added(t, card, arr[0]) : [];
        if (!keys.length) continue;
        const [types, props] = card === 'categoryAxis' && keys.every((k) => k === 'showAxisTitle') ? ALLOWED.categoryAxisTitle : ALLOWED[card];
        check(types.includes(t) && keys.every((k) => props.includes(k)), `${tag}: ${t}.${card} ${keys.join(', ')} is not in the theme schema`);
      }
      const col = got.clusteredColumnChart['*'], tbl = got.tableEx['*'];
      check(col.labels[0].show === (c[0] === 'on'), `${tag}: data labels ${JSON.stringify(col.labels)}`);
      check(col.valueAxis[0].gridlineShow === (c[1] === 'dotted') && (c[1] !== 'dotted' || col.valueAxis[0].gridlineStyle === 'dotted'), `${tag}: gridlines ${JSON.stringify(col.valueAxis)}`);
      check(c[2] === 'off' ? col.legend[0].show === false : col.legend[0].position === c[2], `${tag}: legend ${JSON.stringify(col.legend)}`);
      check((c[3] === 'off') === (col.categoryAxis?.[0].showAxisTitle === false), `${tag}: axis titles ${JSON.stringify(col.categoryAxis)}`);
      check(c[4] === 'auto' ? !tbl.grid : tbl.grid[0].gridHorizontal === (c[4] === 'minimal') && tbl.values[0].fontSize === vs.tableEx['*'].values[0].fontSize, `${tag}: table ${JSON.stringify(tbl)}`);
      // the preview follows: labels on the bars, the legend where it is set
      const pv = await v.pg.evaluate(() => ({ labels: document.querySelectorAll('#preview svg text[font-size="7"]').length, legend: !!document.querySelector('#preview .tg-legend') }));
      check((pv.labels > 0) === (c[0] === 'on') && pv.legend === (c[2] !== 'off'), `${tag}: preview ${JSON.stringify(pv)}`);
    }
    await v.pg.reload({ waitUntil: 'networkidle' });
    check(await v.pg.$eval('#csLegend', (e) => e.value) === 'Right', 'Chart style is not kept after reload');
    if (v.errs.length) problems.push(`chart style: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  // Download names: the theme's own name in any script, the same for the JSON and the other files
  {
    const v = await open('en');
    const names = {};
    for (const n of ['سمة المبيعات', 'Café Theme', '***']) {
      await v.pg.fill('#themeName', n);
      names[n] = await v.pg.evaluate(() => {
        let name = null; const click = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () { name = this.download; };
        try { document.getElementById('dlBtn').click(); } finally { HTMLAnchorElement.prototype.click = click; }
        return name;
      });
    }
    check(names['سمة المبيعات'] === 'سمة-المبيعات.json' && names['Café Theme'] === 'café-theme.json' && names['***'] === 'power-bi-theme.json', `theme file names: ${JSON.stringify(names)}`);
    if (v.errs.length) problems.push(`file names: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  // Readability: a ratio just under the target (#777 on white is 4.48) never shows as the target it misses
  {
    const v = await open('en');
    for (const [k, c] of [['u_card', '#ffffff'], ['u_text', '#777777']]) await v.pg.fill(`#uiColors input[type=text][data-key="${k}"]`, c);
    const first = await v.pg.$eval('#contrast div', (d) => ({ cls: d.className, text: d.textContent }));
    check(first.cls === 'warn' && /4\.4:1 \(aim for 4\.5:1\)/.test(first.text), `readability: ${first.text}`);
    if (v.errs.length) problems.push(`readability: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  // Hex boxes: a pasted code with spaces or the short #abc form is taken; anything else is reset with a message
  {
    const v = await open('en');
    const box = '#uiColors input[type=text][data-key="u_accent"]';
    const put = async (t) => { await v.pg.fill(box, t); await v.pg.locator(box).blur(); return v.pg.evaluate((b) => ({ box: document.querySelector(b).value, saved: JSON.parse(localStorage.getItem('dataarcus-theme-generator')).ui.accent, toast: document.getElementById('toast').textContent }), box); };
    let r = await put(' #112233 ');
    check(r.saved === '#112233' && r.box === '#112233', `hex: " #112233 " gives ${JSON.stringify(r)}`);
    r = await put('#abc');
    check(r.saved === '#aabbcc', `hex: #abc gives ${JSON.stringify(r)}`);
    for (const bad of ['zzzzzz', '']) {
      r = await put(bad);
      check(r.box === '#aabbcc' && r.saved === '#aabbcc' && /hex color/.test(r.toast), `hex: "${bad}" is left in the box: ${JSON.stringify(r)}`);
    }
    if (v.errs.length) problems.push(`hex: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
