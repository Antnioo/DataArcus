// 0.3.2 SP29 (the split, finish, mcp/work/SP29.md): every page that loads the design engine draws and downloads exactly
// what it did before its layout geometry and typography moved to design-metrics.js and its saved designs to
// design-state.js. Each page is opened twice: once as it is, once with the base engine (the saved bytes of 39c46bb,
// mcp/fixtures/hk1/sp29, the engine before this split; SP29_BASE=<commit> reads that commit with git instead) served in place of
// design-engine.min.js and the two new files served empty. Each time a true first visit (the glass look, the default),
// the plain design and an old saved design the page repairs on load (v1: corners 12, no accent bar, a 1600 x 900 page,
// right to left, a broken colour): the preview's screenshot must be pixel for pixel the same, and the downloaded
// theme JSON and background PNG byte for byte. Pages: the generator in English and Arabic, the lab page in both.
import fs from 'node:fs';
import { visitor, ready, settle } from './lib.mjs';
import { baseEngine as readBase } from './base-engine.mjs';

const PAGES = [['generator EN', '/tools/power-bi-theme-generator.html?lang=en'], ['generator AR', '/ar/tools/power-bi-theme-generator.html'],
  ['lab EN', '/tools/power-bi-theme-generator-lab.html?lang=en'], ['lab AR', '/tools/power-bi-theme-generator-lab.html?lang=ar']];
const OLD_SAVE = JSON.stringify({ preset: 'Midnight', name: 'Old save', font: 'Tahoma', data: ['#4cc9f0', '#f72585', '#ffd166', '#4361ee', '#b5179e', 'nope', '#7209b7', '#06d6a0'],
  ui: { background: '#0b0d17', card: '#15182a', text: '#e8eaf6', accent: '#4cc9f0', good: '#06d6a0', neutral: '#ffd166', bad: '#ef476f' }, chart: { look: 'auto', table: 'banded' },
  layout: { radius: 12, accentBar: false, page: 'custom', pageW: 1600, pageH: 900, dir: 'rtl', preset: 'analysis', filters: true, kpis: 3 } });

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  let baseEngine, BASE;
  try { ({ bytes: baseEngine, label: BASE } = readBase({ suite: 'sp29', envName: 'SP29_BASE', commit: '39c46bb', sha256: '64b824c9fc23cf7c3201348661717cf655f4e91a5124b322d4fabf88d63e13f4' })); } catch (e) { return { checks: 1, problems: [`the base engine (39c46bb) could not be read: ${e.message}`] }; }

  // what one visit shows and downloads: the preview's pixels, the theme JSON, the background PNG
  const visit = async (address, look, base) => {
    // (no smooth scroll, no animation: a screenshot taken while the page still moves differs at its edges by a pixel)
    const v = await visitor(browser, { downloads: true, plainDesign: look === 'plain', motion: 'reduce' });
    if (look === 'saved') await v.ctx.addInitScript((d) => { try { localStorage.setItem('dataarcus-theme-generator', d); } catch (e) { /* ignore */ } }, OLD_SAVE);
    if (base) {
      await v.ctx.route(/\/assets\/js\/design-(metrics|state)\.min\.js/, (rt) => rt.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
      await v.ctx.route(/\/assets\/js\/design-engine\.min\.js/, (rt) => rt.fulfill({ status: 200, contentType: 'text/javascript', body: baseEngine }));
    }
    try {
      await v.pg.goto(url + address, { waitUntil: 'networkidle' });
      await ready(v.pg);
      await v.pg.evaluate(() => document.getElementById('preview').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await settle(v.pg);
      const shot = await v.pg.locator('#preview').screenshot({ animations: 'disabled' });
      const file = async (sel) => { const [d] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click(sel)]); return fs.readFileSync(await d.path()); };
      const theme = await file('#dlBtn'), png = await file('#pngBtn');
      return { shot, theme, png, errs: v.errs.slice() };
    } finally { await v.ctx.close(); }
  };

  for (const [name, address] of PAGES) {
    const shots = [], files = [];
    for (const look of ['glass', 'plain', 'saved']) {
      const now = await visit(address, look, false), was = await visit(address, look, true);
      shots.push(now.shot.equals(was.shot) && !now.errs.length && !was.errs.length ? '' : `${look}: the preview differs (${now.shot.length} vs ${was.shot.length} bytes)${now.errs.length || was.errs.length ? ', errors ' + now.errs.concat(was.errs).join(' | ') : ''}`);
      files.push(now.theme.equals(was.theme) && now.png.equals(was.png) && now.theme.length > 1000 ? '' : `${look}: the theme ${now.theme.equals(was.theme) ? 'same' : 'differs'}, the PNG ${now.png.equals(was.png) ? 'same' : 'differs'}`);
    }
    check(shots.every((s) => !s), `${name}: the preview, now vs the base engine (${BASE}): ${shots.filter(Boolean).join('; ')}`);
    check(files.every((s) => !s), `${name}: the downloads, now vs the base engine (${BASE}): ${files.filter(Boolean).join('; ')}`);
  }
  return { checks, problems };
}
