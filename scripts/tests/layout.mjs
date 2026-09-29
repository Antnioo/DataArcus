// Layout stress test for the theme generator: every layout, filter position, header on/off,
// direction, KPI count and extreme slider values. Every visual must stay on the page,
// keep a usable size and never overlap another.
// Default: 1920 x 1080. With --full: all three presets and two custom sizes.
import { visitor } from './lib.mjs';

export default async function ({ browser, url, full, page = '/tools/power-bi-theme-generator.html' }) {
  const problems = []; let checks = 0;
  const sizes = full ? ['1280x720', '1920x1080', '960x720', 'c3840x2160', 'c1366x768'] : ['1920x1080'];
  for (const size of sizes) {
    const v = await visitor(browser, { viewport: [1440, 1000] });
    await v.pg.goto(`${url}${page}`, { waitUntil: 'networkidle' });
    const res = await v.pg.evaluate(async (PAGE) => {
      const C = document.getElementById('layout');
      const click = (l, val) => { const x = C.querySelector(`button[data-l="${l}"][data-v="${val}"]`); if (x) x.click(); return !!x; };
      const setChk = (l, on) => { const x = C.querySelector(`input[type=checkbox][data-l="${l}"]`); if (x && x.checked !== on) x.click(); };
      const found = new Set();
      const slide = (l, val) => { const x = C.querySelector(`input[type=range][data-l="${l}"]`); if (!x) return; found.add(l); x.value = Math.round(val * (+x.dataset.f || 1)); x.dispatchEvent(new Event('input', { bubbles: true })); };
      const read = () => [...document.querySelectorAll('#slotTable tbody tr')].map((tr) => { const t = [...tr.children].map((td) => td.textContent); return { n: t[0], k: t[1], x: +t[2], y: +t[3], w: +t[4], h: +t[5] }; });
      const probs = []; let n = 0;
      const EXT = { min: { hh: 44, logoW: 100, fw: 160, fh: 56, kpiH: 64, mainW: 40, split: 30 }, max: { hh: 96, logoW: 360, fw: 320, fh: 120, kpiH: 160, mainW: 75, split: 70 },
        mixA: { hh: 96, logoW: 360, fw: 320, fh: 120, kpiH: 160, mainW: 40, split: 30 }, mixB: { hh: 44, logoW: 100, fw: 160, fh: 56, kpiH: 64, mainW: 75, split: 70 } };
      const [PWd, PHd] = PAGE.replace('c', '').split('x').map(Number), sc = PHd / 720;
      for (const preset of ['exec', 'analysis', 'ops', 'focus']) for (const fpos of ['none', 'start', 'end', 'top']) for (const header of [true, false]) for (const dir of ['ltr', 'rtl']) for (const kp of [3, 6]) for (const [en, ex] of Object.entries(EXT)) {
        if (PAGE[0] === 'c') { click('page', 'custom'); for (const [k, val] of [['pageW', PWd], ['pageH', PHd]]) { const i = C.querySelector(`input[data-l="${k}"]`); i.value = val; i.dispatchEvent(new Event('change', { bubbles: true })); } } else click('page', PAGE);
        click('preset', preset); click('reset', '');
        setChk('header', header); setChk('filters', fpos !== 'none'); if (fpos !== 'none') click('fpos', fpos);
        click('dir', dir); click('kpis', kp);
        for (const [k, val] of Object.entries(ex)) slide(k, val);
        const S = read(); n++;
        const tag = `${PAGE}/${preset}/${fpos}/${header ? 'header' : 'no header'}/${dir}/${kp} KPIs/${en}`;
        if (S.length < 5) probs.push(tag + ': only ' + S.length + ' visuals');
        for (const s of S) {
          if (s.x < 0 || s.y < 0 || s.x + s.w > PWd || s.y + s.h > PHd) probs.push(tag + ': off the page: ' + s.n);
          const small = s.k.includes('Text box (page') || s.k.includes('Image'), minW = small ? 60 : 100, minH = small ? 20 : (s.n === 'Filters' ? 56 : 60);
          if (s.w < Math.floor(minW * sc) || s.h < Math.floor(minH * sc)) probs.push(tag + ': too small: ' + s.n + ' ' + s.w + 'x' + s.h);
        }
        for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) { const a = S[i], c = S[j]; if (a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h) probs.push(tag + ': overlap: ' + a.n + ' / ' + c.n); }
      }
      const missing = ['hh', 'logoW', 'fw', 'fh', 'kpiH', 'mainW', 'split'].filter((k) => !found.has(k));
      if (missing.length) probs.push(PAGE + ': sliders never found: ' + missing.join(', '));
      return { n, probs };
    }, size);
    checks += res.n; problems.push(...res.probs);
    if (v.errs.length) problems.push(`${size}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
