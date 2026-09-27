// Spacing follows the scale in style.css (--space-xs 8, sm 16, md 24, lg 48 / 32 on phones).
// On every page, a box and whatever sits directly above or below it in the same container
// must be one step of the scale apart (or touching). Also checks the page top: content starts
// one lg step below the navbar. (Sections meet with one xl step by construction: section padding is xl / 2.)
import { pages, visitor } from './lib.mjs';

const TOL = 4; // sub-pixel rounding and line-height of inline buttons

const measure = () => {
  const isBox = (e) => { const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    return parseFloat(cs.borderTopLeftRadius) >= 8 && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0) && r.width >= 200 && r.height >= 60; };
  const hasBox = (e) => isBox(e) || (e.children.length === 1 && isBox(e.children[0]));
  const name = (e) => (e.id ? '#' + e.id : '') + (e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : e.tagName.toLowerCase());
  const pairs = [];
  for (const par of document.querySelectorAll('main, main *, body > section, body > div')) {
    if (par.closest('nav:not(.tg-steps), footer, svg, .cc-bar, #layCanvas, .tg-preview, table')) continue;
    const kids = [...par.children].filter((k) => { const cs = getComputedStyle(k), r = k.getBoundingClientRect();
      return r.height > 0 && r.width > 0 && !['absolute', 'fixed'].includes(cs.position) && !['SCRIPT', 'STYLE', 'BR'].includes(k.tagName); })
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    for (let i = 1; i < kids.length; i++) {
      const a = kids[i - 1].getBoundingClientRect(), c = kids[i].getBoundingClientRect();
      if (c.top < a.bottom - 1) continue;                          // side by side
      if (c.right <= a.left + 10 || c.left >= a.right - 10) continue; // not stacked
      if (!hasBox(kids[i - 1]) && !hasBox(kids[i])) continue;
      pairs.push({ gap: Math.round(c.top - a.bottom), what: name(kids[i - 1]) + ' → ' + name(kids[i]) });
    }
  }
  const nav = document.getElementById('navbar');
  // first thing on the page: text or a picture
  const first = [...document.querySelectorAll('main *, body > section *')].filter((e) => e.children.length === 0 && e.getBoundingClientRect().height > 0 && (e.textContent.trim() || e.tagName === 'IMG') && !e.closest('nav'))
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
  const css = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v));
  return { pairs, top: first && nav ? Math.round(first.getBoundingClientRect().top + scrollY - nav.offsetHeight) : null, lg: css('--space-lg'), xl: css('--space-xl'),
    hero: !!document.querySelector('.hero, .nf') };  // full-screen designs with centered content
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  for (const p of pages()) for (const vp of [[1440, 900], [390, 844]]) {
    // animations off, so scroll-in effects (AOS, main.js fade-in) cannot shift boxes while measuring
    const v = await visitor(browser, { viewport: vp, motion: 'reduce' });
    await v.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' });
    const r = await v.pg.evaluate(measure);
    const steps = [0, 8, 16, 24, r.lg];
    const tag = `${p} ${vp[0]}px`;
    for (const x of r.pairs) {
      checks++;
      if (!steps.some((s) => Math.abs(s - x.gap) <= TOL)) problems.push(`${tag}: ${x.what} ${x.gap}px (scale: ${steps.join(', ')})`);
    }
    // page top: the first content sits one lg step below the navbar (the homepage hero and the 404 page are centered full-screen designs)
    if (!r.hero && r.top !== null) { checks++; if (Math.abs(r.top - r.lg) > 12) problems.push(`${tag}: page content starts ${r.top}px below the navbar (scale: ${r.lg})`); }
    await v.ctx.close();
  }
  return { checks, problems };
}
