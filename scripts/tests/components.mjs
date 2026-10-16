// Shared components look the same on every page (the owner, 14 Oct 2026: fix it at the root, so every page
// changes at once). Three checks:
//   1. calls to action (below);
//   2. the label above a page's title is .page-badge with no other look on it, and it is the same colour, size and
//      font on every page;
//   3. the blog: every filter shows at least one article, and every article it shows is visible (not stuck at
//      opacity 0 by the scroll-in animation), and each card's topic label is its filter's name.
// 1. Calls to action: the box is
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
  out.badges = [...document.querySelectorAll('.page-badge')].map((b) => { const c = getComputedStyle(b); return { cls: b.className, look: [c.backgroundColor, c.color, c.fontSize, c.fontWeight, c.paddingTop, c.borderTopLeftRadius].join(' '), text: b.textContent.trim().slice(0, 30) }; });
  // a label above a title that is not the shared one (a Bootstrap badge right before a page's h1)
  out.strayBadges = [...document.querySelectorAll('h1')].map((h) => h.previousElementSibling).filter((e) => e && e.classList.contains('badge')).map((e) => e.className);
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
    checks++; if (r.strayBadges.length) problems.push(`${tag}: a label above the title is not .page-badge: ${r.strayBadges.join(' | ')}`);
    for (const b of r.badges) {
      checks++;
      if (b.cls !== 'page-badge') problems.push(`${tag}: "${b.text}" has more classes than page-badge: ${b.cls}`);
      const first = seen.get('badge ' + vp[0]);
      if (!first) seen.set('badge ' + vp[0], { look: b.look, where: `${tag} "${b.text}"` });
      else if (first.look !== b.look) problems.push(`${tag}: "${b.text}" looks ${b.look}, not ${first.look} as ${first.where}`);
    }
    if (p === 'blog.html') {
      // with animations on, as most visitors have them: the scroll-in animation is what hid filtered articles
      const a = await visitor(browser, { viewport: vp });
      await a.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' });
      await ready(a.pg);
      for (const f of await a.pg.$$eval('[data-filter]', (bs) => bs.map((x) => x.getAttribute('data-filter')))) {
        await a.pg.click(`[data-filter="${f}"]`); await a.pg.waitForTimeout(1200);
        const shown = await a.pg.$$eval('[data-category]', (cs) => cs.filter((c) => c.style.display !== 'none').map((c) => { const r = c.getBoundingClientRect(); return { onScreen: r.top < innerHeight && r.bottom > 0, op: getComputedStyle(c).opacity, topic: (c.querySelector('.topic-badge') || { getAttribute: () => null }).getAttribute('data-i18n'), colour: c.querySelector('.topic-badge') ? getComputedStyle(c.querySelector('.topic-badge')).backgroundColor : null, cat: c.getAttribute('data-category') }; }));
        checks++; if (!shown.length) problems.push(`${tag}: the "${f}" filter shows no article`);
        checks++; if (f !== 'all' && shown.some((c) => c.cat !== f)) problems.push(`${tag}: the "${f}" filter also shows ${[...new Set(shown.filter((c) => c.cat !== f).map((c) => c.cat))].join(', ')}`);
        for (const c of shown) {
          // on screen, it must be visible (below the screen it fades in as the visitor scrolls to it)
          if (c.onScreen) { checks++; if (c.op !== '1') problems.push(`${tag}: under "${f}" an article on screen is invisible (opacity ${c.op})`); }
          checks++; if (c.topic !== 'topics.' + c.cat) problems.push(`${tag}: a card in "${c.cat}" is labelled ${c.topic}`);
          const k = 'topic ' + c.cat, firstC = seen.get(k);
          checks++; if (!firstC) seen.set(k, c.colour); else if (firstC !== c.colour) problems.push(`${tag}: two "${c.cat}" cards have different label colours (${firstC}, ${c.colour})`);
        }
      }
      await a.ctx.close();
    }
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
