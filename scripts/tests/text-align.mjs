// Text alignment (owner 18 Oct 2026): a button's small count sits on its label's baseline, and a small all-caps pill
// has its capitals centred in it. Both are fixed once, in assets/css/style.css (the .btn rule and the shared
// .cap-pill), so every page follows; the guard makes every new small uppercase pill use .cap-pill.
import { createRequire } from 'node:module';
import { pages, visitor, ready } from './lib.mjs';
const { PNG } = createRequire(import.meta.url)('pngjs');

// a small uppercase element with its own text and a background or a border, outside tables: a pill
function findPills() {
  const shown = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const own = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  return [...document.querySelectorAll('body *')].filter((e) => {
    const s = getComputedStyle(e);
    if (s.textTransform !== 'uppercase' || parseFloat(s.fontSize) > 16 || /^(TH|TD)$/.test(e.tagName) || !own(e) || !shown(e)) return false;
    const bg = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none';
    const border = ['Top', 'Bottom', 'Left', 'Right'].some((k) => parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none');
    return bg || border;
  });
}

// (a) every button with an icon and a <small>: the small text's baseline against the label's, measured with a
// zero-size inline-block at the end of each text piece (its bottom is the baseline). The label's own text is wrapped
// in a span first: a flex container makes loose text an anonymous item, and a span item is aligned the same way
function baselines() {
  const mark = (into) => { const m = document.createElement('span'); m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; into.appendChild(m); return m; };
  const out = [];
  for (const b of document.querySelectorAll('button, a')) {
    const small = b.querySelector('small'), r = b.getBoundingClientRect();
    if (!b.querySelector(':scope > i[class*="bi-"]') || !small || !r.width) continue;
    const text = [...b.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!text) continue;
    const wrap = document.createElement('span'); text.replaceWith(wrap); wrap.appendChild(text);
    const a = mark(wrap), c = mark(small);
    out.push({ label: b.textContent.trim().slice(0, 40), label_y: a.getBoundingClientRect().bottom, small_y: c.getBoundingClientRect().bottom });
    a.remove(); c.remove(); wrap.replaceWith(text);
  }
  return out;
}

const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

// (b) the capitals' ink is centred in the pill: the pill is shot twice, with its text and with the text transparent,
// and the rows that differ in the middle half of its width are the ink. The text is written as Latin capitals for the
// shot (HHHH), so Arabic letters and the tail of a Q don't count as capitals; the line box is the same
async function centring(pg, tag) {
  const bad = [];
  // the scroll animations (AOS) are shown at once here, which moves nothing inside a pill; the panels' own fade-ins
  // are waited for (some start invisible), and each shot waits for two painted frames
  await pg.addStyleTag({ content: '[data-aos]{opacity:1!important;transform:none!important;transition:none!important} .cap-pill,.cap-pill *{transition:none!important}' });
  // a page can render its results twice (the Health Check redraws after loading): wait until nothing in the page
  // has changed for half a second, so the pills measured are the ones shown
  await pg.evaluate(() => new Promise((done) => { let t = setTimeout(fin, 500); const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(fin, 500); });
    function fin() { mo.disconnect(); done(); } mo.observe(document.body, { childList: true, subtree: true, characterData: true }); setTimeout(fin, 8000); }));
  await pg.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => null))));
  const n = await pg.evaluate((fp) => { window.__pills = (0, eval)('(' + fp + ')')().filter((e) => !e.closest('.cap-pill-skip')); return window.__pills.length; }, findPills.toString());
  for (let i = 0; i < n; i++) {
    const box = await pg.evaluate((i) => {
      const e = window.__pills[i]; if (!e.isConnected) return { w: 0, h: 0 };
      e.scrollIntoView({ block: 'center', behavior: 'instant' });
      e.__text = [...e.childNodes].filter((x) => x.nodeType === 3).map((x) => [x, x.textContent]);
      e.__text.forEach(([x], k) => { x.textContent = k ? '' : 'HHHH'; });
      [...e.children].forEach((c) => c.style.setProperty('visibility', 'hidden', 'important'));   // an icon is not a capital
      const r = e.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, name: e.className };
    }, i);
    if (box.w < 4 || box.h < 4) continue;
    const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.w), height: Math.round(box.h) };
    // a panel can still be fading in (a script or a transition that starts late): wait until the pill and every box
    // around it are fully opaque, and shoot again if no ink shows (a busy machine paints late)
    await pg.waitForFunction((i) => { let o = 1; for (let x = window.__pills[i]; x; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o > 0.99; }, i, { timeout: 5000 }).catch(() => null);
    // the pill must not move between the two shots (a late scroll or layout on a busy machine): its box is read
    // before and after, and the pair is shot again when it moved or showed no ink
    let withText, noText;
    const where = (i) => { const r = window.__pills[i].getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => x.toFixed(2)).join(); };
    for (let tries = 0; tries < 5; tries++) {
      await pg.evaluate(frames);
      const before = await pg.evaluate(where, i);
      Object.assign(box, await pg.evaluate((i) => { const r = window.__pills[i].getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, i));
      Object.assign(clip, { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.w), height: Math.round(box.h) });
      withText = PNG.sync.read(await pg.screenshot({ clip }));
      await pg.evaluate((i) => { window.__pills[i].style.setProperty('color', 'transparent', 'important'); }, i);
      await pg.evaluate(frames);
      noText = PNG.sync.read(await pg.screenshot({ clip }));
      await pg.evaluate((i) => { window.__pills[i].style.removeProperty('color'); }, i);
      const after = await pg.evaluate(where, i);
      if (before === after && withText.data.some((v, k) => Math.abs(v - noText.data[k]) > 40)) break;
      await pg.waitForTimeout(300);
    }
    await pg.evaluate((i) => { const e = window.__pills[i]; e.style.removeProperty('color'); e.__text.forEach(([x, t]) => { x.textContent = t; }); [...e.children].forEach((c) => c.style.removeProperty('visibility')); }, i);
    // each row's ink: the largest change in the middle half of the width. A pill sits at fractional pixels, so the
    // first and last ink rows are partly covered: their share of a full row's ink is the edge's subpixel position,
    // and the gaps are measured from the pill's exact box, not the rounded screenshot
    const ink = [];
    for (let y = 0; y < withText.height; y++) {
      let d = 0;
      for (let x = Math.floor(withText.width / 4); x < Math.ceil(withText.width * 3 / 4); x++) {
        const k = (y * withText.width + x) * 4;
        d = Math.max(d, Math.abs(withText.data[k] - noText.data[k]), Math.abs(withText.data[k + 1] - noText.data[k + 1]), Math.abs(withText.data[k + 2] - noText.data[k + 2]));
      }
      ink.push(d);
    }
    const full = Math.max(...ink), rows = ink.map((d, y) => (d > full * 0.15 ? y : -1)).filter((y) => y >= 0);
    if (full < 40 || !rows.length) { bad.push(`${tag} .${box.name}: no ink found`); continue; }
    const r0 = rows[0], r1 = rows[rows.length - 1];
    const inkTop = r0 + 1 - Math.min(1, ink[r0] / full), inkBottom = r1 + Math.min(1, ink[r1] / full);
    const top = inkTop - (box.y - clip.y), bottom = (box.y + box.h - clip.y) - inkBottom;
    // centred within 1 px: the middle of the ink at most 1 px from the middle of the pill (Chrome puts text on whole
    // pixels, so a perfectly set pill can still measure half a pixel either way)
    if (Math.abs(top - bottom) / 2 > 1) bad.push(`${tag} .${box.name.split(' ')[0]}: ink ${top.toFixed(1)}px from the top, ${bottom.toFixed(1)}px from the bottom (${box.h.toFixed(1)}px high)`);
  }
  return { n, bad };
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  // the guard: every pill on the page uses the shared .cap-pill
  const guard = async (pg, tag) => {
    const off = await pg.evaluate((fp) => (0, eval)('(' + fp + ')')().filter((e) => !e.classList.contains('cap-pill')).map((e) => e.tagName.toLowerCase() + '.' + [...e.classList].join('.')), findPills.toString());
    check(!off.length, `${tag}: small uppercase pills without .cap-pill: ${[...new Set(off)].join(', ')}`);
  };

  // every page as it loads: the guard
  for (const p of pages()) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' }); await ready(v.pg);
    await guard(v.pg, p);
    await v.ctx.close();
  }

  // the states that show pills and counted buttons, in English and Arabic, on a desktop and a phone
  const STATES = [
    ['index.html', null], ['blog.html', null], ['tools/index.html', null], ['tools/power-bi-theme-generator.html', null], ['tools/svg-kpi-designer.html', null],
    ['tools/power-bi-model-health-check.html', async (pg) => { await pg.click('#mhSample'); await pg.waitForSelector('.mh-issue', { timeout: 20000 }); }],
    ['tools/power-bi-model-health-check.html#fix', async (pg) => { await pg.click('#mhSample'); await pg.waitForSelector('.mh-issue', { timeout: 20000 }); await pg.click('[data-tab=fix]'); await pg.waitForSelector('.mh-prem', { timeout: 20000 }); }],
    ['tools/pl-300-practice-exam.html', async (pg) => { await pg.click('[data-go="mock"]'); await pg.click('[data-len="quick"]'); await pg.click('#dpGo'); await pg.click('#dpRev'); await pg.click('#dpSubmit');
      const ok = await pg.$('.dp-modal [data-ok]'); if (ok) await ok.click(); await pg.waitForSelector('.dp-passbadge', { timeout: 20000 }); }]
  ];
  for (const [page, act] of STATES) for (const lang of ['en', 'ar']) for (const vp of [[1440, 900], [390, 844]]) {
    const tag = `${page} (${lang}, ${vp[0]} px)`;
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/${page.replace(/#.*/, '')}?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(v.pg);
    if (act) await act(v.pg);
    await guard(v.pg, tag);
    for (const b of await v.pg.evaluate(baselines)) check(Math.abs(b.label_y - b.small_y) <= 0.5, `${tag}: "${b.label}": the count's baseline is ${(b.label_y - b.small_y).toFixed(1)} px above the label's`);
    const c = await centring(v.pg, tag);
    checks += c.n; problems.push(...c.bad);
    if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
