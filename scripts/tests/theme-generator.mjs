// Power BI Theme & Layout Generator: saved-design upgrades, accent bars and corners,
// page sizes, the theme JSON, the download reminders, and the example.
import { visitor, settle } from './lib.mjs';

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
    const got = (await json()).visualStyles['*']['*'].border[0].radius;
    check(got === want, `${size} radius ${r}: theme JSON has ${got}, expected ${want}`);
  }
  await v.pg.click('#dlVis [data-l=transparent][data-v="1"]');
  check((await json()).visualStyles['*']['*'].background[0].show === false, 'Transparent choice not in the theme JSON');
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

  // 5. The example: loads, scrolls to the layout, Undo restores the visitor's own design exactly
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
  return { checks, problems };
}
