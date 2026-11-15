// 0.3.2 SP6 (the split, mcp/work/SP6.md): the Theme Generator draws and downloads exactly what it did before the design
// engine's colours moved to design-colours.js and its glass look to design-glass.js. The same page is opened twice in
// each language: once as it is, once with the base engine (the saved bytes of 04a9922, mcp/fixtures/hk1/sp6, the last engine
// in one file; SP6_BASE=<commit> reads that commit with git instead) served in place of design-engine.min.js and the two new files served empty.
// Each time a true first visit (the glass look, the default) and the plain design: the preview's screenshot must be
// pixel for pixel the same, and the downloaded theme JSON and background PNG byte for byte.
import fs from 'node:fs';
import { visitor, ready, settle } from './lib.mjs';
import { baseEngine as readBase } from './base-engine.mjs';

const PAGE = '/tools/power-bi-theme-generator.html';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  let baseEngine, BASE;
  try { ({ bytes: baseEngine, label: BASE } = readBase({ suite: 'sp6', envName: 'SP6_BASE', commit: '04a9922', sha256: 'c65211868a4d55a122ed0dc92b493000463388ca860b6c58a4f228228dbb7a44' })); } catch (e) { return { checks: 1, problems: [`the base engine (04a9922) could not be read: ${e.message}`] }; }

  // what one visit shows and downloads: the preview's pixels, the theme JSON, the background PNG
  const visit = async (lang, plainDesign, base) => {
    // (no smooth scroll, no animation: a screenshot taken while the page still moves differs at its edges by a pixel)
    const v = await visitor(browser, { downloads: true, plainDesign, motion: 'reduce' });
    if (base) {
      // (0.3.2 SP29) every file split from the engine since is served empty too: the base engine is the whole engine
      await v.ctx.route(/\/assets\/js\/design-(colours|glass|metrics|state)\.min\.js/, (rt) => rt.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
      await v.ctx.route(/\/assets\/js\/design-engine\.min\.js/, (rt) => rt.fulfill({ status: 200, contentType: 'text/javascript', body: baseEngine }));
    }
    try {
      await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' });
      await ready(v.pg);
      await v.pg.evaluate(() => document.getElementById('preview').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await settle(v.pg);
      const shot = await v.pg.locator('#preview').screenshot({ animations: 'disabled' });
      const file = async (sel) => { const [d] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click(sel)]); return fs.readFileSync(await d.path()); };
      const theme = await file('#dlBtn'), png = await file('#pngBtn');
      return { shot, theme, png, errs: v.errs.slice() };
    } finally { await v.ctx.close(); }
  };

  for (const lang of ['en', 'ar']) {
    const shots = [], files = [];
    for (const plain of [false, true]) {
      const now = await visit(lang, plain, false), was = await visit(lang, plain, true), look = plain ? 'plain' : 'glass';
      shots.push(now.shot.equals(was.shot) && !now.errs.length && !was.errs.length ? '' : `${look}: the preview differs (${now.shot.length} vs ${was.shot.length} bytes)${now.errs.length || was.errs.length ? ', errors ' + now.errs.concat(was.errs).join(' | ') : ''}`);
      files.push(now.theme.equals(was.theme) && now.png.equals(was.png) && now.theme.length > 1000 ? '' : `${look}: the theme ${now.theme.equals(was.theme) ? 'same' : 'differs'}, the PNG ${now.png.equals(was.png) ? 'same' : 'differs'}`);
    }
    check(shots.every((s) => !s), `${lang}: the preview, now vs the base engine (${BASE}): ${shots.filter(Boolean).join('; ')}`);
    check(files.every((s) => !s), `${lang}: the downloads, now vs the base engine (${BASE}): ${files.filter(Boolean).join('; ')}`);
  }
  return { checks, problems };
}
