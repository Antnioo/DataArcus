// 0.3.2 SP35 (the split, finish: main.js -> site-navigation.js, site-forms.js, site-analytics.js; mcp/work/SP35.md):
// everything main.js does on a page, characterised on the base (integration/0.3.2 c2dbd06, before any move) and the
// same after each move. 15 sessions, each on a fresh visitor, English (?lang=en) and Arabic (the ar/ copy), with
// Math.random seeded and made-up input only: the home page (navbar, top offsets, counters, particles, AOS, WhatsApp,
// ripple), the clicks the adapter counts (mail, phone, WhatsApp, release, CTA, outbound, a language switch, a form's
// first focus), a #contact arrival, the phone menu (an inside link, an outside click, Escape), the contact form sent and
// failed with the validation UX, the beta form, the blog (search, filters, a phone number redacted), a dashboard's live
// report facade, an article read, the Berlin banner (Accept), a London Reject (cookies cleared), privacy's "Cookie
// settings" after consent, an AI referral, reduced motion, and AOS blocked. After every step: the page's state, every
// gtag call (dataLayer) and Clarity call (its queue), the trackers' hosts requested, what was posted to Web3Forms, the
// errors. Recorded in fixtures/sp35-site.json; SP35_RECORD=1 records again (only on the base, never to make a run pass).
//   E1..E15  EN sessions as recorded;  A1..A15  AR sessions as recorded
//   M1  (one per new module) every page that loads main.min.js loads the module once, before main.min.js, in the order
//       site-navigation, site-forms, site-analytics
//   M2  (after the first move) consent stays in the adapter: no other site-*.js (and, after the last move, not main.js) names gtag, clarity,
//       daConsent, dataLayer, dataArcusTrack or a tracker's host
//   M3  (one per new module) each new module states its interface at its top
//   M4  (after the last move) main.js is a bootstrap: under 60 lines, its only listener DOMContentLoaded
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { visitor, ready, ROOT, WAIT, trackWork, markWork, quiet } from './lib.mjs';
import { releasedVersion } from '../check-release.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp35-site.json');
// the released version (one place: check-release.mjs) is a token in the recorded and the live events, so a release does not trip E7
const RELEASED = releasedVersion(), TOKEN = (x) => x.split(RELEASED).join('<release>');
const MODS = ['site-navigation', 'site-forms', 'site-analytics'];
const JS = (n) => path.join(ROOT, 'assets/js', n + '.js');
const have = MODS.filter((n) => fs.existsSync(JS(n)));
const sha = (s) => (s == null ? null : crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 24) + ':' + Buffer.byteLength(s, 'utf8'));

// Math.random seeded (the particles), and every Web3Forms post kept
const SEED = () => {
  let a = 35;
  Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};
// (CI3) every ripple the page adds, kept until the step's state is read: the ripple is removed 600 ms after the click,
// and the read now waits for that timer (quiet), so the state counts the ripples of the step, not those still on screen
const RIPPLES = () => {
  window.__ripples = new Set();
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains('ripple')) window.__ripples.add(n); })))
    .observe(document, { childList: true, subtree: true });
};
// (CI3) a step's effects are waited for, never timed (lib.mjs quiet: the page's short timers, frames, transitions and
// scroll since the step began); fixed waits of 100 to 3000 ms raced them on a busy runner (I-1112-1700)
const until = (pg, fn, arg) => pg.waitForFunction(fn, arg, { timeout: WAIT }).catch(() => null);
// a made-up link, clicked and kept from navigating (the adapter listens on document, capture)
const linkClick = (pg, href, text, cls) => pg.evaluate(([h, t, c]) => {
  const a = document.createElement('a'); a.href = h; a.textContent = t; if (c) a.className = c;
  a.addEventListener('click', (e) => e.preventDefault()); document.querySelector('main, body').appendChild(a); a.click(); a.remove();
}, [href, text, cls || '']);
// a real link of the page, clicked and kept from navigating
const realClick = (pg, sel) => pg.evaluate((q) => { const a = document.querySelector(q); a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); }, sel);
const scrollTo = (pg, y) => pg.evaluate((n) => window.scrollTo({ top: n, behavior: 'instant' }), y);
const fillContact = async (pg) => { await pg.fill('#contact-name', 'Test Person'); await pg.fill('#contact-email', 'person@example.com'); await pg.fill('#contact-company', 'Made-up Co'); await pg.fill('#contact-details', 'A made-up request.'); };
// sent: the button is enabled again when the post has its answer (site-forms.js, finally)
const send = (sel) => async (pg) => { await pg.evaluate((q) => document.querySelector(q).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await pg.click(sel); await until(pg, (q) => !document.querySelector(q).disabled, sel); };
const openMenu = (pg) => pg.click('.navbar-toggler');

// [name, page, visitor options, steps]; a step is [label, act]; opts.before(ctx, pg) runs before the page opens
const SESSIONS = [
  ['home: navbar, offsets, counters, particles, ripple', 'index.html', {}, [
    ['scroll 400', (pg) => scrollTo(pg, 400)], ['the counters in view', async (pg) => { await pg.evaluate(() => document.querySelector('#about [data-count]').scrollIntoView({ block: 'center', behavior: 'instant' })); await until(pg, () => [...document.querySelectorAll('#about [data-count]')].every((c) => c.textContent === c.getAttribute('data-count') + (c.getAttribute('data-suffix') || ''))); }],
    ['back to the top', (pg) => scrollTo(pg, 0)], ['the toggler clicked twice (blurred; the menu opened and closed again)', async (pg) => { for (let i = 0; i < 2; i++) { await markWork(pg); await pg.evaluate(() => document.querySelector('.navbar-toggler').click()); await quiet(pg); } }],
    ['a ripple on the submit button', async (pg) => { await pg.evaluate(() => document.querySelector('#contact-form button[type=submit]').scrollIntoView({ block: 'center', behavior: 'instant' })); await pg.click('#contact-form button[type=submit]'); }],
    ['the ripple gone', () => null]]],
  ['home: the clicks the adapter counts', 'index.html', { consent: 'granted' }, [
    ['mail', (pg) => linkClick(pg, 'mailto:someone@example.com', 'Email us')], ['phone', (pg) => linkClick(pg, 'tel:+000000000', 'Call')],
    ['whatsapp', (pg) => linkClick(pg, 'https://wa.me/000000000', 'Chat')], ['release', (pg) => linkClick(pg, 'https://github.com/Antnioo/dataarcus-releases/releases/tag/v9.9.9', 'Download 9.9.9')],
    ['release latest', (pg) => linkClick(pg, 'https://github.com/Antnioo/dataarcus-releases/releases/latest', 'Download')],
    ['a #contact CTA', (pg) => linkClick(pg, '#contact', 'Talk to us')], ['a btn-accent', (pg) => linkClick(pg, '/tools/', 'Tools', 'btn btn-accent')],
    ['outbound', (pg) => linkClick(pg, 'https://user:pw@www.example.com/a/b?email=x@y.com#f', 'Example')], ['internal', (pg) => linkClick(pg, '/blog.html', 'Blog')],
    ['the WhatsApp button', (pg) => realClick(pg, '.wa-float')],
    ['a form first focus, twice', async (pg) => { await pg.focus('#contact-name'); await pg.focus('#contact-email'); await pg.evaluate(() => document.activeElement.blur()); await pg.focus('#contact-name'); }],
    ['the language attribute flips', (pg) => pg.evaluate(() => { document.documentElement.lang = document.documentElement.lang === 'ar' ? 'en' : 'ar'; })]]],
  ['a #contact arrival', 'index.html#contact', {}, [['settled', (pg) => until(pg, () => document.documentElement.classList.contains('smooth-scroll'))]]],   // the arrival's 2.5 s hold ended
  ['phone menu', 'index.html', { viewport: [390, 844] }, [
    ['open', openMenu], ['an inside link', (pg) => pg.evaluate(() => document.querySelector('a[href="#contact"]').click())],
    ['open again', async (pg) => { await scrollTo(pg, 0); await openMenu(pg); }], ['an outside click', (pg) => pg.mouse.click(200, 700)],
    ['open again', openMenu], ['Escape', (pg) => pg.keyboard.press('Escape')]]],
  ['contact form sent', 'index.html', { consent: 'granted' }, [['fill', fillContact], ['send', send('#contact-form button[type=submit]')]]],
  ['contact form failed, validation UX', 'index.html', { consent: 'granted', fail: true }, [
    ['focus name', (pg) => pg.focus('#contact-name')], ['blur empty', (pg) => pg.focus('#contact-company')], ['a bad email', (pg) => pg.fill('#contact-email', 'not-an-email')],
    ['a good email', (pg) => pg.fill('#contact-email', 'person@example.com')], ['fill', fillContact], ['send (500)', send('#contact-form button[type=submit]')],
    ['type again (result cleared)', (pg) => pg.type('#contact-company', 'x')]]],
  ['beta form and the release link', 'power-bi-mcp/index.html', { consent: 'granted' }, [
    ['the release link', (pg) => realClick(pg, 'a[href*="dataarcus-releases/releases"]')],
    ['fill', async (pg) => { await pg.fill('#beta-name', 'Test Person'); await pg.fill('#beta-email', 'person@example.com'); await pg.fill('#beta-model', 'A made-up model.'); }],
    ['send', send('#beta-form button[type=submit]')]]],
  ['blog: search, filters, redaction', 'blog.html', { consent: 'granted' }, [
    ['search dax', (pg) => pg.fill('#blogSearch', 'dax')], ['a filter', (pg) => pg.click('[data-filter]:not([data-filter="all"])')],
    ['search a phone number', (pg) => pg.fill('#blogSearch', '050 123 4567')], ['search nothing found', (pg) => pg.fill('#blogSearch', 'zzzqqq')],
    ['all, cleared', async (pg) => { await pg.fill('#blogSearch', ''); await pg.click('[data-filter="all"]'); }]]],
  ['dashboard: the live report facade', 'dashboards/adventureworks-dashboard.html', { consent: 'granted' }, [
    ['load the live report', (pg) => pg.click('[data-pbi-src] button')]]],
  ['article read', 'articles/article-clv.html', { consent: 'granted', clock: true }, [
    ['scroll to the end', (pg) => pg.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))],
    ['31 s later', (pg) => pg.clock.fastForward(31000)]]],
  ['Berlin: the banner, Accept', 'index.html', { timezone: 'Europe/Berlin', consent: null }, [
    ['accept', (pg) => pg.click('[data-cc="accept"]')], ['the next page', async (pg, o) => { await pg.goto(o.page('portfolio.html'), { waitUntil: 'networkidle' }); await ready(pg); }]]],
  ['London: Reject clears the cookies', 'index.html', { timezone: 'Europe/London', consent: null }, [
    ['cookies set', (pg) => pg.evaluate(() => { document.cookie = '_ga=GA1.1.1; path=/'; document.cookie = '_clck=x; path=/'; document.cookie = 'keep=1; path=/'; })],
    ['reject', (pg) => pg.click('[data-cc="reject"]')], ['the next page', async (pg, o) => { await pg.goto(o.page('portfolio.html'), { waitUntil: 'networkidle' }); await ready(pg); }]]],
  ['privacy: Cookie settings after consent', 'privacy.html', { consent: 'granted' }, [
    ['open', (pg) => pg.click('[data-cc-open]')], ['reject', (pg) => pg.click('[data-cc="reject"]')],
    ['open again, accept', async (pg) => { await pg.click('[data-cc-open]'); await pg.click('[data-cc="accept"]'); }]]],
  ['an AI referral', 'index.html', { consent: 'granted', referer: 'https://chatgpt.com/c/made-up-id' }, [['clicked nothing', () => null]]],
  ['reduced motion, AOS blocked', 'index.html', { motion: 'reduce', noAos: true }, [['scroll 400', (pg) => scrollTo(pg, 400)]]]
];

// the page's state, as main.js leaves it
const state = (pg) => pg.evaluate(() => {
  const $ = (q) => document.querySelector(q), $$ = (q) => [...document.querySelectorAll(q)], root = document.documentElement, cs = getComputedStyle(root);
  const html = (q) => { const e = $(q); return e ? e.innerHTML.replace(/\s+/g, ' ').trim() : null; };
  const disp = (q) => { const e = $(q); return e ? e.style.display : null; };
  const wa = $('.wa-float'), bar = $('.cc-bar'), menu = $('#navmenu'), nav = $('.navbar');
  const a = document.activeElement;
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const ser = (x) => (x instanceof Date ? 'Date' : x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, ser(v)])) : Array.isArray(x) ? x.map(ser) : x);
  return {
    navbar: nav ? nav.className : null, navH: root.style.getPropertyValue('--nav-h'), pinH: root.style.getPropertyValue('--pin-h'), smooth: root.classList.contains('smooth-scroll'),
    year: ($('#year') || {}).textContent === String(new Date().getFullYear()),
    particles: $$('#interactiveBg .particle').map((p) => p.getAttribute('style')).join('|'), aos: $$('[data-aos]').length,
    counters: $$('#about [data-count], [data-stats] [data-count]').map((c) => c.textContent).join(' '),
    wa: wa ? [wa.getAttribute('href'), wa.getAttribute('aria-label'), wa.title, wa.parentElement.tagName, wa.parentElement.getAttribute('aria-label')].join(' | ') : null,
    bar: bar ? [bar.getAttribute('aria-label'), bar.innerHTML].join(' | ') : null, ccOpen: document.body.classList.contains('cc-open'), ccH: document.body.style.getPropertyValue('--cc-h') !== '',
    // (CI3) the ripples this step added (RIPPLES), and any still on screen; then the next step counts its own
    menu: menu ? menu.className : null, ripples: ((n) => { window.__ripples = new Set(); return n; })(new Set([...(window.__ripples || []), ...$$('.ripple')]).size),
    results: ['#form-result', '#beta-form-result'].map((q) => [disp(q), html(q)].join(' ')).join(' || '),
    buttons: $$('form button[type=submit]').map((b) => { const c = b.cloneNode(true); c.querySelectorAll('.ripple').forEach((r) => r.remove()); return [b.disabled, c.innerHTML.replace(/\s+/g, ' ').trim()].join(' '); }).join(' || '),
    fields: $$('form .form-control').map((f) => f.id + ':' + [f.parentElement.classList.contains('focused') && 'focused', f.classList.contains('is-valid') && 'valid', f.classList.contains('is-invalid') && 'invalid', f.value].filter(Boolean).join(',')).join(' '),
    cards: $$('[data-category]').map((c, i) => (c.style.display === 'none' ? '' : i)).filter((x) => x !== '').join(','), noResults: disp('#noResults'),
    filters: $$('[data-filter]').map((b) => b.classList.contains('active') ? b.getAttribute('data-filter') : '').filter(Boolean).join(','),
    frames: $$('[data-pbi-src] iframe').map((f) => [f.getAttribute('src'), f.title, f.getAttribute('allowfullscreen'), f.getAttribute('frameborder'), document.activeElement === f].join(' ')).join(' || '),
    active: a ? a.tagName + (a.id ? '#' + a.id : '') : null,
    landed: target ? Math.abs(target.getBoundingClientRect().top - parseFloat(cs.scrollPaddingTop || '0')) <= 2 : null,
    consent: localStorage.getItem('dataarcus-consent'), cookies: document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter(Boolean).sort().join(','),
    gtag: (window.dataLayer || []).map((x) => JSON.stringify(ser([...x]))),
    clarity: ((window.clarity && window.clarity.q) || []).map((x) => JSON.stringify(ser([...x]))),
    lang: root.lang
  };
});

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const recording = process.env.SP35_RECORD === '1';
  const gold = recording ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  for (const lang of ['en', 'ar']) {
    got[lang] = {};
    const page = (p) => { const [file, hash] = p.split('#'); return lang === 'en' ? `${url}/${file}?lang=en${hash ? '#' + hash : ''}` : `${url}/ar/${file}${hash ? '#' + hash : ''}`; };
    for (const [k, [name, start, opts, steps]] of SESSIONS.entries()) {
      const id = (lang === 'en' ? 'E' : 'A') + (k + 1), bad = [];
      const v = await visitor(browser, { viewport: opts.viewport || [1440, 900], timezone: opts.timezone || 'Asia/Dubai', consent: opts.consent === undefined ? 'denied' : opts.consent, motion: opts.motion || 'no-preference' });
      await v.ctx.addInitScript(SEED); await v.ctx.addInitScript(RIPPLES); if (!opts.clock) await trackWork(v.ctx);   // (a fake clock replaces the timers trackWork wraps)
      const posts = [];
      await v.ctx.route(/web3forms/, (rt) => { posts.push(rt.request().postData()); rt.fulfill({ status: opts.fail ? 500 : 200, body: '' }); });
      if (opts.noAos) await v.ctx.route(/cdn\.jsdelivr\.net\/npm\/aos/, (rt) => rt.abort());
      if (opts.clock) await v.pg.clock.install();
      const rec = [];
      try {
        await v.pg.goto(page(start), { waitUntil: 'networkidle', ...(opts.referer ? { referer: opts.referer } : {}) }); await ready(v.pg);
        for (const [label, act] of [['opened', null]].concat(steps)) {
          await markWork(v.pg);
          try { if (act) await act(v.pg, { page }); } catch (e) { bad.push(`${label}: ${e.message.split('\n')[0]}`); break; }
          await quiet(v.pg);
          const st = await state(v.pg);
          st.gtag = st.gtag.map(TOKEN);
          // the counters and the ripple are read in the home session only (elsewhere a smooth scroll can pass the
          // counters and start them at any moment); the ripple's own geometry is never read
          rec.push({ step: label, ...st, counters: k === 0 ? st.counters : null, ripples: k === 0 ? st.ripples : null, particles: sha(st.particles), bar: sha(st.bar), hits: [...new Set(v.hits)].sort().join(','), posts: posts.slice(), errs: v.errs.slice() });
        }
      } catch (e) { bad.push(`${name}: ${e.message.split('\n')[0]}`); }
      await v.ctx.close();
      got[lang][id] = { name, rec };
      if (!recording) {
        const want = (gold[lang] || {})[id];
        if (!want) bad.push('no record');
        else {
          const n = Math.max(want.rec.length, rec.length);
          for (let i = 0; i < n && bad.length < 6; i++) {
            const a = want.rec[i] || {}, b = rec[i] || {};
            for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
              if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) bad.push(`${a.step || b.step} ${key}: ${String(JSON.stringify(a[key])).slice(0, 300)} -> ${String(JSON.stringify(b[key])).slice(0, 300)}`);
            }
          }
        }
      }
      check(!bad.length, `${id} ${name} (${lang}): ${bad.slice(0, 6).join(' | ')}`);
    }
  }
  if (recording) fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n');

  // M1: the load order on every page that loads main.min.js
  if (have.length) {
    const files = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT }).toString().trim().split(/\r?\n/);
    for (const n of have) {
      const wrong = [];
      for (const f of files) {
        const h = fs.readFileSync(path.join(ROOT, f), 'utf8'), main = h.indexOf('main.min.js');
        if (main < 0) continue;
        const at = [...h.matchAll(new RegExp(`/${n}\\.min\\.js\\?v=`, 'g'))].map((m) => m.index);
        const before = MODS.slice(0, MODS.indexOf(n)).filter((m) => have.includes(m)).map((m) => h.indexOf(`/${m}.min.js?v=`));
        if (at.length !== 1 || at[0] > main || before.some((b) => b < 0 || b > at[0])) wrong.push(f);
      }
      check(!wrong.length, `M1 ${n}.min.js must be loaded once, before main.min.js and after the modules before it: ${wrong.slice(0, 6).join(', ')}${wrong.length > 6 ? ` and ${wrong.length - 6} more` : ''}`);
    }
    // M2: consent stays in the adapter
    const code = (f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const TRACKERS = ['gtag', 'clarity', 'daConsent', 'dataLayer', 'dataArcusTrack', 'googletagmanager', 'clarity.ms'];
    const leaks = [...MODS.filter((n) => n !== 'site-analytics' && have.includes(n)), ...(have.length === MODS.length ? ['main'] : [])].flatMap((n) => TRACKERS.filter((w) => code(JS(n)).includes(w)).map((w) => `${n}: ${w}`));
    check(!leaks.length, `M2 only site-analytics.js may call a tracker or touch consent: ${leaks.join(', ')}`);
    // M3: the interface at the top of each new module
    const API = { 'site-navigation': ['SiteNavigation', 'init(', 'whatsapp(', 'dataarcus:embed'], 'site-forms': ['SiteForms', 'init(', 'attach(', 'dataarcus:lead'], 'site-analytics': ['SiteAnalytics', 'init(', 'banner(', 'dataArcusTrack(', 'dataarcus:lead', 'dataarcus:embed'] };
    for (const n of have) {
      const top = (/^\/\*[\s\S]*?\*\//.exec(fs.readFileSync(JS(n), 'utf8')) || [''])[0];
      check(API[n].every((w) => top.includes(w)), `M3 ${n}.js must state its interface at its top (${API[n].join(', ')})`);
    }
  }
  // M4: main.js is a bootstrap
  if (have.length === MODS.length) {
    const src = fs.readFileSync(JS('main'), 'utf8'), lines = src.split('\n').length, ls = [...src.matchAll(/addEventListener\('([\w:]+)'/g)].map((m) => m[1]);
    check(lines < 60 && ls.length === 1 && ls[0] === 'DOMContentLoaded', `M4 main.js must be a bootstrap (under 60 lines, one DOMContentLoaded listener): ${lines} lines, listeners ${ls.join(', ')}`);
  }
  return { checks, problems };
}
