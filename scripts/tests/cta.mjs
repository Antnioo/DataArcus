// Calls to action look the same on every page (the owner, 14 Oct 2026: fix it at the root). The box is
// "glass-card cta" and its buttons sit in "cta-actions"; their size lives only in style.css. On every page:
// every call to action (a box titled finalCta / exploreMore / cta, and the beta page's header buttons) uses
// the component; no button in it is resized on the page (btn-lg, padding classes); and every such button
// has the same height, padding and font size as every other one, on the page and across the site.
import { pages, visitor, ready } from './lib.mjs';

const measure = () => {
  const out = { outside: [], resized: [], buttons: [] };
  for (const t of document.querySelectorAll('[data-i18n="finalCta.title"], [data-i18n="exploreMore.title"], [data-i18n="cta.title"]')) {
    if (!t.closest('.cta')) out.outside.push(t.getAttribute('data-i18n'));
  }
  for (const b of document.querySelectorAll('.cta-actions .btn')) {
    if (/\b(btn-lg|btn-sm|p[xy]?-\d|m[xy]?-\d)\b/.test(b.className)) out.resized.push(b.className);
    const cs = getComputedStyle(b), r = b.getBoundingClientRect();
    const span = b.querySelector('span'), lh = parseFloat(getComputedStyle(span || b).lineHeight);
    out.buttons.push({ lines: span ? Math.round(span.getBoundingClientRect().height / lh) : 1, h: Math.round(r.height), pad: cs.paddingLeft + ' ' + cs.paddingRight + ' ' + cs.paddingTop, font: cs.fontSize, text: b.textContent.trim().slice(0, 30) });
  }
  return out;
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0; const seen = new Map();
  for (const p of pages()) for (const vp of [[1440, 900], [390, 844]]) {
    const v = await visitor(browser, { viewport: vp, motion: 'reduce' });
    await v.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' });
    await ready(v.pg);
    const r = await v.pg.evaluate(measure);
    const tag = `${p} ${vp[0]}px`;
    checks++; if (r.outside.length) problems.push(`${tag}: a call to action outside the .cta box: ${r.outside.join(', ')}`);
    checks++; if (r.resized.length) problems.push(`${tag}: a call-to-action button resized on the page: ${r.resized.join(' | ')}`);
    for (const b of r.buttons) {
      checks++;
      // a label longer than a phone's width wraps (same padding and font, more lines): its height is not compared
      if (b.lines > 1) continue;
      const key = `${b.pad} ${b.font}`, first = seen.get(vp[0]);
      if (!first) seen.set(vp[0], { key, h: b.h, where: `${tag} "${b.text}"` });
      else if (first.key !== key || Math.abs(first.h - b.h) > 1) problems.push(`${tag}: "${b.text}" is ${b.h}px (${key}), not ${first.h}px (${first.key}) as ${first.where}`);
    }
    await v.ctx.close();
  }
  return { checks, problems };
}
