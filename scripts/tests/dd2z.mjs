// 0.3.2 DD2Z (mcp/work/DD2Z.md): the SVG KPI designer page's preview of the "Progress ring" starter when the target is BLANK or 0.
// Desktop (2.159.1231.0, lab/look032 B): DIVIDE by BLANK or by 0 is BLANK, the compiled COALESCE ( _Achievement, 0 ) turns it to 0, so
// the ring is empty and reads "0%": never an error, never an empty cell. Rendered ?lang=en and the Arabic page.
//   R1  a BLANK target (the test value cleared): the ring reads 0% and draws no arc
//   R2  a 0 target: the same
//   R3  the starter's own target (1500000 against 1240000): 83% and an arc
//   no page error and no toast in any of them
import { visitor } from './lib.mjs';
import { HOOKS, frame, h } from './sp25.mjs';

const read = (pg) => pg.evaluate(() => {
  const svg = document.querySelector('#stage svg.kd-svg');
  const circles = [...svg.querySelectorAll('circle')], arc = circles.find((c) => c.getAttribute('stroke-dasharray'));
  const text = [...svg.querySelectorAll('text')].map((t) => t.textContent);
  return { percent: text.find((t) => /%$/.test(t)) || null, dash: arc ? arc.getAttribute('stroke-dasharray') : null, opacity: arc ? arc.getAttribute('stroke-opacity') : null, toast: (document.getElementById('toast') || {}).textContent || '' };
});

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  for (const lang of ['en', 'ar']) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.ctx.addInitScript(HOOKS);
    const pg = v.pg;
    await pg.goto(lang === 'en' ? `${url}/tools/svg-kpi-designer.html?lang=en` : `${url}/ar/tools/svg-kpi-designer.html`, { waitUntil: 'networkidle' });
    await pg.evaluate(() => localStorage.removeItem('dataarcus-svg-kpi-v2'));
    await pg.reload({ waitUntil: 'networkidle' });
    await pg.waitForFunction(() => document.querySelector('#stage svg.kd-svg') && document.getElementById('dax').textContent.length > 0, null, { timeout: 30000 });
    await h.starter(pg, 'ring'); await frame(pg);
    const sel = '#values input[type="number"][data-v="1"][data-vk="sample"]';
    const own = await read(pg);
    check(own.percent === '83%' && own.dash && !/^0\.00 /.test(own.dash), `R3 ${lang}: the starter's own target reads ${own.percent} with arc ${own.dash}, wanted 83% and an arc`);
    await h.type(pg, sel, '0'); await frame(pg);
    const zero = await read(pg);
    check(zero.percent === '0%' && /^0\.00 /.test(zero.dash || '') && zero.opacity === '0', `R2 ${lang}: a 0 target reads ${zero.percent}, arc ${zero.dash}, opacity ${zero.opacity}; wanted 0% and no arc`);
    await h.type(pg, sel, ''); await pg.keyboard.press('Delete'); await frame(pg);
    const blank = await read(pg);
    check(blank.percent === '0%' && /^0\.00 /.test(blank.dash || '') && blank.opacity === '0', `R1 ${lang}: a BLANK target reads ${blank.percent}, arc ${blank.dash}, opacity ${blank.opacity}; wanted 0% and no arc`);
    check(!zero.toast.trim() && !blank.toast.trim() && !v.errs.length, `${lang}: a toast or a page error: ${zero.toast} ${blank.toast} ${v.errs.join('; ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
