// Every page, in English and Arabic, on a phone and a laptop:
// no errors, no missing translations, no sideways scrolling, nothing marked hidden on screen, the phone menu opens,
// and the top offset (style.css --top-offset) matches the real navbar.
import fs from 'node:fs';
import path from 'node:path';
import { pages, visitor, ROOT, ready, WAIT } from './lib.mjs';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  // text-only translations (data-i18n) replace the whole element, so their HTML must be plain text:
  // an icon or tag inside would be wiped, and duplicated text would still show to search engines
  for (const p of pages()) {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    for (const m of html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)<(?!\/)/g)) problems.push(`${p}: data-i18n="${m[1]}" has a tag inside ("${m[2].trim().slice(0, 40)}...")`);
    checks++;
  }
  for (const p of pages()) for (const lang of ['en', 'ar']) for (const vp of [[390, 844], [1440, 900]]) {
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/${p}?lang=${lang}`, { waitUntil: 'networkidle' });
    await ready(v.pg);
    const tag = `${p} ${lang} ${vp[0]}px`;
    const r = await v.pg.evaluate(() => {
      const nav = document.getElementById('navbar'), pins = [...document.querySelectorAll('[data-pin]')].reduce((a, e) => a + e.offsetHeight, 0);
      return {
        missing: document.body.innerText.includes('[Missing:'),
        // share previews and search snippets: title, description, og:/twitter: text and og:locale follow the page language
        meta: [['title', document.title], ...['description', 'twitter:title', 'twitter:description'].map((n) => [n, document.querySelector(`meta[name="${n}"]`)]),
          ...['og:title', 'og:description', 'og:locale'].map((n) => [n, document.querySelector(`meta[property="${n}"]`)])]
          .filter(([, e]) => e !== null).map(([n, e]) => [n, typeof e === 'string' ? e : e.getAttribute('content') || '']),
        // translated attributes (data-i18n-placeholder, -alt, -aria-label, -title): never a missing key, and Arabic on Arabic pages
        attrs: ['placeholder', 'alt', 'aria-label', 'title'].flatMap((a) => [...document.querySelectorAll(`[data-i18n-${a}]`)].map((e) => [a, e.getAttribute(a) || ''])),
        // on Arabic pages no label stays English: every alt, aria-label, placeholder and title in words has a translation
        // (brand names alone, like "LinkedIn", and fields marked translate="no", such as model names, stay as they are)
        untranslated: document.documentElement.lang === 'ar' ? ['placeholder', 'alt', 'aria-label', 'title'].flatMap((a) => [...document.querySelectorAll(`[${a}]:not([data-i18n-${a}])`)]
          .filter((e) => !e.closest('svg, script, template, iframe, [translate="no"]') && e.getClientRects().length && /[A-Za-z]{2}/.test(e.getAttribute(a)) && !/[\u0600-\u06FF]/.test(e.getAttribute(a)) && !/^(LinkedIn|WhatsApp|GitHub|X|YouTube|Instagram|Microsoft Learn|DataArcus)$/i.test(e.getAttribute(a).trim()))
          .map((e) => `${a}="${e.getAttribute(a).slice(0, 40)}"`)) : [],
        sideways: document.documentElement.scrollWidth > innerWidth,
        offset: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
        expected: nav ? nav.offsetHeight + pins + 12 : null,
        // an element marked hidden must not show, whatever display class it has (Bootstrap's d-flex beats its own [hidden])
        shownHidden: [...document.querySelectorAll('[hidden]')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.id || e.className || e.tagName),
        // forward and back arrows point the reading direction: mirrored exactly once on Arabic pages
        arrows: [...document.querySelectorAll('.bi-arrow-right, .bi-arrow-left, .bi-arrow-right-circle, .bi-arrow-left-circle')].filter((e) => e.getClientRects().length).map((e) => {
          let flips = 0; for (let n = e; n && n.nodeType === 1; n = n.parentElement) if (/^matrix\(-1/.test(getComputedStyle(n).transform)) flips++;
          if (/^matrix\(-1/.test(getComputedStyle(e, '::before').transform)) flips++;
          return flips % 2;
        })
      };
    });
    if (r.missing) problems.push(`${tag}: missing translation`);
    const badMeta = r.meta.filter(([n, val]) => (n === 'og:locale' ? !val.startsWith(lang) : lang === 'ar' && !/[\u0600-\u06FF]/.test(val)));
    if (badMeta.length) problems.push(`${tag}: meta not in the page language: ${badMeta.map(([n, val]) => n + '=' + val.slice(0, 40)).join(' | ')}`);
    const badAttrs = r.attrs.filter(([, val]) => val.includes('[Missing:') || (lang === 'ar' && !/[\u0600-\u06FF]/.test(val)));
    if (badAttrs.length) problems.push(`${tag}: attributes not translated: ${badAttrs.slice(0, 3).map(([a, val]) => a + '=' + val).join(' | ')}`);
    if (r.sideways) problems.push(`${tag}: page scrolls sideways`);
    const wrongWay = r.arrows.filter((f) => f !== (lang === 'ar' ? 1 : 0)).length;
    if (wrongWay) problems.push(`${tag}: ${wrongWay} of ${r.arrows.length} arrows point against the reading direction`);
    if (r.untranslated.length) problems.push(`${tag}: English labels: ${[...new Set(r.untranslated)].join(' | ')}`);
    if (r.shownHidden.length) problems.push(`${tag}: hidden but shown: ${r.shownHidden.join(', ')}`);
    if (r.expected !== null && Math.abs(r.offset - r.expected) > 1) problems.push(`${tag}: top offset ${r.offset}, navbar needs ${r.expected}`);
    if (vp[0] < 992 && await v.pg.locator('.navbar-toggler').count()) {
      await v.pg.click('.navbar-toggler'); await v.pg.waitForTimeout(450);
      if (!await v.pg.evaluate(() => document.querySelector('#navmenu')?.classList.contains('show'))) problems.push(`${tag}: phone menu does not open`);
      // an open menu must not push pinned bars down, even if the screen resizes (phone rotation)
      await v.pg.evaluate(() => dispatchEvent(new Event('resize')));
      const nav = await v.pg.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')));
      if (r.expected !== null && nav > 90) problems.push(`${tag}: open menu counted as navbar height (${nav}px)`);
    }
    if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
    checks++; await v.ctx.close();
  }
  // animated numbers: the served HTML holds the final number (what search engines, link previews and a browser
  // without JavaScript show), and the count-up starts from 0 only when the script runs
  for (const p of pages().filter((p) => fs.readFileSync(path.join(ROOT, p), 'utf8').includes('data-count='))) {
    for (const lang of ['en', 'ar']) {
      const html = await (await fetch(`${url}/${p}?lang=${lang}`)).text();
      const wrong = [...html.matchAll(/<[^>]*\bdata-count="([^"]*)"[^>]*?(?:data-suffix="([^"]*)")?[^>]*>([^<]*)</g)].filter((m) => m[3].trim() !== m[1] + (m[2] || '')).map((m) => `"${m[3].trim()}" (want ${m[1] + (m[2] || '')})`);
      if (wrong.length) problems.push(`${p} ${lang}: served HTML shows counters as ${wrong.join(', ')}`);
      checks++;
    }
  }
  // animated numbers reach their value once scrolled into view, also on a short screen (a phone held sideways)
  for (const p of pages().filter((p) => fs.readFileSync(path.join(ROOT, p), 'utf8').includes('data-count='))) {
    const v = await visitor(browser, { viewport: [844, 390] });
    await v.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' });
    const n = await v.pg.locator('[data-count]').count();
    // still out of view: waiting at 0 to count up
    const early = await v.pg.$$eval('[data-count]', (els) => els.filter((e) => e.getBoundingClientRect().top > innerHeight && e.textContent.trim() !== '0').length);
    if (early) problems.push(`${p} 844x390: ${early} counter(s) below the screen are not waiting at 0 to count up`);
    for (let i = 0; i < n; i++) { await v.pg.locator('[data-count]').nth(i).scrollIntoViewIfNeeded(); await v.pg.waitForTimeout(150); }
    await v.pg.waitForTimeout(2500);
    const wrong = await v.pg.$$eval('[data-count]', (els) => els.filter((e) => e.textContent.trim() !== e.dataset.count + (e.dataset.suffix || '')).map((e) => `${e.textContent.trim()} (want ${e.dataset.count})`));
    if (wrong.length) problems.push(`${p} 844x390: counters stuck at ${wrong.join(', ')}`);
    checks++; await v.ctx.close();
  }
  // blog search looks in each card's title, excerpt and category, not its date
  for (const [lang, term] of [['en', 'quiz'], ['en', 'september'], ['ar', 'اختبار']]) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/blog.html?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.fill('#blogSearch', term); await v.pg.waitForTimeout(500);
    const r = await v.pg.evaluate((term) => {
      const cards = [...document.querySelectorAll('[data-category]')], has = (c) => ['h3', 'p', '.badge'].some((s) => (c.querySelector(s) || { textContent: '' }).textContent.toLowerCase().includes(term));
      return { shown: cards.filter((c) => c.style.display !== 'none').length, want: cards.filter(has).length, wrong: cards.filter((c) => (c.style.display !== 'none') !== has(c)).length };
    }, term);
    if (r.wrong) problems.push(`blog ${lang} search "${term}": shows ${r.shown} posts, ${r.want} contain it`);
    checks++; await v.ctx.close();
  }
  // footer links slide as smoothly in as out: while hovered, each one still animates its move, not only its colour
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/index.html?lang=en`, { waitUntil: 'networkidle' });
    for (const sel of ['footer a[data-i18n="footer.links.powerbi"]', 'footer a[data-i18n="footer.links.about"]', 'footer a[href^="mailto:"]']) {
      await v.pg.hover(sel);
      const t = await v.pg.$eval(sel, (e) => { const s = getComputedStyle(e); return s.transitionProperty + ' ' + s.transitionDuration; });
      checks++; if (!/^all 0\.3s/.test(t)) problems.push(`footer ${sel} while hovered: transition ${t}, the slide jumps instead of easing`);
    }
    await v.ctx.close();
  }

  // The web-font swap doesn't move the page (audit AUD-002, 2026-10-04). The suites block web fonts, so here the
  // pages get Inter from @fontsource (the same font) half a second late, as on a real connection: English pages
  // shift at most 0.1 when it arrives. On Arabic pages the text waits for the Arabic font (IBM Plex Sans Arabic,
  // stood in for by a font served late), so it never re-wraps in front of the reader; never longer than 1.5 s.
  {
    const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
    const fontFile = (w) => path.join(ROOT, `node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff2`);
    const css = (family) => [400, 500, 600, 700, 800].map((w) => `@font-face{font-family:'${family}';font-weight:${w};font-display:swap;src:url(https://fonts.gstatic.com/x/inter-${w >= 600 ? 700 : 400}.woff2) format('woff2')}`).join('\n');
    const lateFonts = async (v, delay) => {
      await v.ctx.route(/fonts\.googleapis\.com\/css2/, (r) => r.fulfill({ status: 200, contentType: 'text/css', headers: { 'access-control-allow-origin': '*' }, body: css(/Arabic/.test(r.request().url()) ? 'IBM Plex Sans Arabic' : 'Inter') }));
      await v.ctx.route(/fonts\.gstatic\.com\/x\//, async (r) => { await new Promise((ok) => setTimeout(ok, delay)); r.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(fontFile(/700/.test(r.request().url()) ? 700 : 400)) }); });
    };
    for (const page of ['tools/power-bi-theme-generator.html', 'articles/article-power-bi-model-ai-ready.html', 'tools/power-bi-licensing-cost-calculator.html']) for (const vp of [[1440, 900], [390, 844]]) {
      const v = await visitor(browser, { viewport: vp }); await lateFonts(v, 500);
      await v.ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
      await v.pg.goto(`${url}/${page}?lang=en`, { waitUntil: 'load' }); await v.pg.waitForTimeout(2500);
      const r = await v.pg.evaluate(() => ({ cls: +window.__cls.toFixed(3), inter: document.fonts.check('400 16px Inter') }));
      check(r.inter && r.cls <= 0.1, `${page} ${vp[0]}px: the Inter swap shifts the page ${r.cls}${r.inter ? '' : ' (Inter never loaded)'} (want 0.1 or less)`);
      await v.ctx.close();
    }
    for (const [page, delay] of [['articles/article-gulf-calendar-power-bi.html', 700], ['articles/article-power-bi-licensing-guide.html', 700], ['tools/power-bi-theme-generator.html', 5000]]) {
      const v = await visitor(browser, { viewport: [390, 844] }); await lateFonts(v, delay);
      await v.ctx.addInitScript(() => { window.__shown = 0; const t0 = performance.now(); new MutationObserver(() => { if (!window.__shown && !document.documentElement.classList.contains('i18n-pending')) { window.__shown = performance.now() - t0; window.__fontAtShow = document.fonts.check('400 16px "IBM Plex Sans Arabic"', 'ع'); } }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] }); });
      await v.pg.goto(`${url}/${page}?lang=ar`, { waitUntil: 'load' }); await v.pg.waitForTimeout(Math.min(delay, 2500) + 500);
      const r = await v.pg.evaluate(() => ({ shown: Math.round(window.__shown), font: window.__fontAtShow, pending: document.documentElement.classList.contains('i18n-pending') }));
      const ok = delay < 1500 ? r.font === true && !r.pending : !r.pending && r.shown > 0 && r.shown < 2100;
      check(ok, `${page} ar, Arabic font ${delay} ms late: shown at ${r.shown} ms with the Arabic font ${r.font ? 'loaded' : 'not loaded'}${r.pending ? ', still hidden' : ''}`);
      await v.ctx.close();
    }
  }

  // The live Power BI reports load only when the visitor asks (audit AUD-020, 2026-10-04): each showcase opens with
  // a preview picture and a "Load the live report" button, no request to Power BI before the click (about 6 MB),
  // and the click shows the same report as before (the addresses below are the ones the pages embedded until then).
  {
    const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
    const REPORTS = {
      "dashboards/adventureworks-dashboard.html": "https://app.powerbi.com/view?r=eyJrIjoiNWM0ZTJmMjgtMDMyOS00OGM4LTg1YzYtZWZlODE0OGFjZGUyIiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&pageName=b1001ce2d5a628ad47b5&language=en",
      "dashboards/call-center-dashboard.html": "https://app.powerbi.com/view?r=eyJrIjoiZDljNDRmMzItYWZkZS00ZGZiLWFkOGMtOWY3ODNhMDAxNTA2IiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&language=en",
      "dashboards/consumer-financial-complaints.html": "https://app.powerbi.com/view?r=eyJrIjoiMTliODc1NjktOTM5Yy00OTM2LWIwNzYtMDY1MjE0ZWNiOTVlIiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&language=en",
      "dashboards/dataarcus-pulse.html": "https://app.powerbi.com/view?r=eyJrIjoiYTc3ZWNmYjEtYjQzNS00ZTU3LWJkNDQtMGU5Y2Y5MGQxMjA3IiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&pageName=fd8c012f45535b521bba",
      "dashboards/er-health-dashboard.html": "https://app.powerbi.com/view?r=eyJrIjoiNWU2MmMzNGUtMjU4NS00YTZiLWIyYzYtYTE3MTY3NjQ5NjhiIiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&language=en",
      "dashboards/fintech-dashboard.html": "https://app.powerbi.com/view?r=eyJrIjoiNDlhY2I0YjgtZGI4Mi00NzU4LThhYWMtNGVhNGUzMDBlYTE5IiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&language=en",
      "dashboards/maven-market-dashboard.html": "https://app.powerbi.com/view?r=eyJrIjoiZGJjZmJjYzMtOWQzYi00MzE0LWIwMjktMDJhZjQzZjExZWMxIiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&language=en",
      "dashboards/repeatiq-dashboard.html": "https://app.powerbi.com/view?r=eyJrIjoiMmVmYWFiMDgtNmY5Yy00NDJjLWIwM2ItMjk0MWUwYTlkMzM5IiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&language=en",
      "portfolio.html": "https://app.powerbi.com/view?r=eyJrIjoiYTc3ZWNmYjEtYjQzNS00ZTU3LWJkNDQtMGU5Y2Y5MGQxMjA3IiwidCI6ImJjYzMzYWFhLTU0YmUtNDdkNy05YTcwLTJmMzJhNWM0ZDg4ZiJ9&pageName=fd8c012f45535b521bba"
    };
    for (const [page, src] of Object.entries(REPORTS)) for (const lang of ['en', 'ar']) {
      const v = await visitor(browser, { viewport: [1440, 900] }); const pbi = [];
      v.pg.on('request', (r) => { if (/powerbi\.com|powerapps\.com|analysis\.windows\.net/.test(r.url())) pbi.push(r.url()); });
      await v.pg.goto(`${url}/${page}?lang=${lang}`, { waitUntil: 'networkidle' });
      const f = await v.pg.evaluate(() => { const w = document.querySelector('[data-pbi-src]'), img = w && w.querySelector('img'), b = w && w.querySelector('button');
        return w ? { img: !!(img && img.complete && img.naturalWidth > 0 && img.alt), button: (b && b.innerText.trim()) || '', iframe: !!document.querySelector('iframe') } : null; });
      check(f && f.img && f.button && !f.iframe && !pbi.length, `${page} ${lang}: before the click ${JSON.stringify(f)}, ${pbi.length} requests to Power BI`);
      if (f) {
        await v.pg.click('[data-pbi-src] button');
        const r = await v.pg.evaluate(() => { const i = document.querySelector('[data-pbi-src] iframe'); return i ? { src: i.getAttribute('src'), title: i.title, focused: document.activeElement === i } : null; });
        check(r && r.src === src && r.title.length > 5, `${page} ${lang}: after the click the report is ${r ? r.src.slice(0, 60) + '... "' + r.title + '"' : 'missing'}`);
      }
      if (v.errs.length) problems.push(`${page} ${lang}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }

  // Every file from jsDelivr carries Subresource Integrity (audit AUD-010, 2026-10-04): integrity="sha384-..." equal
  // to the hash of the very file (node_modules holds the same versions, byte for byte), and crossorigin="anonymous".
  {
    const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
    const crypto = await import('node:crypto');
    const sri = (f) => 'sha384-' + crypto.createHash('sha384').update(fs.readFileSync(f)).digest('base64');
    const bad = new Set();
    for (const p of pages()) {
      const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
      for (const m of html.matchAll(/<(script|link)\b[^>]*\b(?:src|href)="https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/([^"]+)"[^>]*>/g)) {
        const file = path.join(ROOT, 'node_modules', m[2], m[3]), want = fs.existsSync(file) ? sri(file) : '(no file in node_modules)';
        const got = (m[0].match(/integrity="([^"]+)"/) || [])[1];
        if (got !== want || !/crossorigin="anonymous"/.test(m[0])) bad.add(`${m[2]}/${m[3]}: ${got ? 'integrity ' + got.slice(0, 20) + '...' : 'no integrity'}${/crossorigin/.test(m[0]) ? '' : ', no crossorigin'} (${p})`);
      }
    }
    check(!bad.size, `jsDelivr files without the right integrity: ${[...bad].slice(0, 4).join('; ')}${bad.size > 4 ? ` and ${bad.size - 4} more` : ''}`);
  }

  // Every page carries a Content Security Policy that allows exactly what it loads (audit AUD-011, 2026-10-04): the
  // policy in each page is the one scripts/csp.mjs computes from it now (an edited inline script changes its hash),
  // and every page opens in English and Arabic without a single violation. The Power BI facade's live report
  // (the only frame) still opens after the click. The tools' own suites and the consent suite run under the policy too:
  // a blocked script, style, font, frame or request is a console error there.
  {
    const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
    const { apply, files } = await import('../csp.mjs');
    const stale = files().filter((f) => apply(fs.readFileSync(path.join(ROOT, f), 'utf8')) !== fs.readFileSync(path.join(ROOT, f), 'utf8'));
    check(!stale.length, `${stale.length} pages without their current Content Security Policy (node scripts/csp.mjs --write): ${stale.slice(0, 5).join(', ')}`);
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser);
      await v.ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI || '(inline)'}`)); });
      const bad = [];
      for (const p of pages()) {
        await v.pg.goto(`${url}/${p}?lang=${lang}`, { waitUntil: 'networkidle' });
        const r = await v.pg.evaluate(() => ({ meta: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'), csp: window.__csp }));
        if (!r.meta) bad.push(`${p}: no policy`);
        if (r.csp.length) bad.push(`${p}: ${[...new Set(r.csp)].slice(0, 3).join(' | ')}`);
      }
      check(!bad.length, `Content Security Policy ${lang}: ${bad.slice(0, 6).join('; ')}${bad.length > 6 ? ` and ${bad.length - 6} more` : ''}`);
      check(!v.errs.length, `Content Security Policy ${lang}: console errors: ${v.errs.slice(0, 3).join(' | ')}`);
      await v.ctx.close();
    }
    const v = await visitor(browser);
    await v.ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); });
    await v.pg.goto(`${url}/dashboards/fintech-dashboard.html?lang=en`, { waitUntil: 'networkidle' });
    await v.pg.click('.pbi-load');
    await v.pg.waitForTimeout(1500);
    const f = await v.pg.evaluate(() => ({ src: (document.querySelector('.pbi-facade iframe') || {}).src || '', csp: window.__csp }));
    check(f.src.startsWith('https://app.powerbi.com/') && !f.csp.length, `Content Security Policy: the live report after the facade click: ${f.src.slice(0, 50) || 'no frame'} ${f.csp.join(' | ')}`);
    await v.ctx.close();
  }

  // jsDelivr only by package (audit AUD-029, 2026-10-05): a policy that allows the whole host lets any package or any
  // GitHub repository it serves run on the page. Every jsDelivr source is a /npm/<package>@<version>/ folder, an
  // unrelated package is refused, and the Bootstrap Icons font (loaded by its own stylesheet) still loads.
  {
    const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
    const { files } = await import('../csp.mjs');
    const wide = [];
    for (const f of files()) {
      const m = fs.readFileSync(path.join(ROOT, f), 'utf8').match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/);
      for (const src of (m ? m[1] : '').split(/[;\s]+/).filter((x) => /cdn\.jsdelivr\.net/.test(x))) if (!/^https:\/\/cdn\.jsdelivr\.net\/npm\/(@[\w.-]+\/)?[\w.-]+@\d[\w.-]*\/$/.test(src)) wide.push(`${f}: ${src}`);
    }
    check(!wide.length, `Content Security Policy allows jsDelivr beyond a package folder: ${wide.slice(0, 4).join('; ')}${wide.length > 4 ? ` and ${wide.length - 4} more` : ''}`);
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser);
      await v.ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
      const r = await v.pg.evaluate(async () => {
        const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'; document.body.appendChild(s);
        await new Promise((ok) => setTimeout(ok, 800)); await document.fonts.ready;
        return { refused: window.__csp.some((x) => /^script-src/.test(x) && /canvas-confetti/.test(x)), ran: typeof window.confetti === 'function',
          icons: [...document.fonts].some((f) => /bootstrap-icons/.test(f.family) && f.status === 'loaded'), other: window.__csp.filter((x) => !/canvas-confetti/.test(x)) };
      });
      check(r.refused && !r.ran, `Content Security Policy ${lang}: an unrelated jsDelivr package was ${r.ran ? 'run' : 'not refused'} on the Health Check`);
      check(r.icons && !r.other.length, `Content Security Policy ${lang}: Bootstrap Icons font ${r.icons ? 'loaded' : 'not loaded'}${r.other.length ? '; other violations: ' + r.other.join(' | ') : ''}`);
      await v.ctx.close();
    }
  }

  // Small text reads at 4.5:1 at least (WCAG AA; night audit 2026-10-05): the card badges of the portfolio and the blog,
  // and inline code in the articles, on whatever is behind them (the nearest background that isn't transparent)
  {
    const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
    for (const p of ['portfolio.html', 'blog.html', 'articles/article-power-bi-model-ai-ready.html', 'articles/article-power-bi-model-health-check.html']) for (const lang of ['en', 'ar']) {
      const v = await visitor(browser, { viewport: [1440, 900] });
      await v.pg.goto(`${url}/${p}?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(v.pg);
      const low = await v.pg.evaluate(() => {
        const rgba = (s) => { const m = s.match(/[\d.]+/g) || [0, 0, 0, 0]; return [+m[0], +m[1], +m[2], m[3] == null ? 1 : +m[3]]; };
        const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
        const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
        const behind = (e) => { const layers = []; for (let n = e; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let bg = [255, 255, 255]; layers.reverse().forEach((c) => { bg = over(c, bg); }); return bg; };
        return [...document.querySelectorAll('.badge, .article-body code')].filter((e) => !e.closest('pre') && e.getClientRects().length && e.textContent.trim()).map((e) => {
          const bg = behind(e), fg = over(rgba(getComputedStyle(e).color), bg), a = lum(fg), b = lum(bg);
          return { t: e.textContent.trim().slice(0, 24), r: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
        }).filter((x) => x.r < 4.5).map((x) => `"${x.t}" ${x.r.toFixed(2)}`);
      });
      check(!low.length, `${p} ${lang}: small text under 4.5:1: ${[...new Set(low)].slice(0, 4).join(', ')}`);
      await v.ctx.close();
    }
  }

  // Every page in the sitemap has a title and a description that fit what search results show (audit AUD-019 and the
  // leftovers of 2026-10-04): at most 60 and 155 characters, in English and in Arabic, as the page sets them after
  // loading its language. (The go/ short links are redirects, not in the sitemap.)
  {
    const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
    const inMap = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/dataarcus\.com\/([^<]*)<\/loc>/g)]
      .map((m) => (!m[1] ? 'index.html' : m[1].endsWith('/') ? m[1] + 'index.html' : m[1]));
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser);
      const wrongLang = [], longTitle = [], longDesc = [];
      for (const p of inMap) {
        await v.pg.goto(`${url}/${p}?lang=${lang}`, { waitUntil: 'networkidle' });
        const m = await v.pg.evaluate(() => ({ title: document.title, description: (document.querySelector('meta[name="description"]') || {}).content || '', lang: document.documentElement.lang }));
        if (m.lang !== lang) wrongLang.push(`${p} (${m.lang})`);
        if ([...m.title].length > 60) longTitle.push(`${p}: ${[...m.title].length} "${m.title}"`);
        if (![...m.description].length || [...m.description].length > 155) longDesc.push(`${p}: ${[...m.description].length}`);
      }
      check(!wrongLang.length, `titles ${lang}: pages not in ${lang}: ${wrongLang.join(', ')}`);
      check(!longTitle.length, `titles ${lang}: over 60 characters: ${longTitle.join('; ')}`);
      check(!longDesc.length, `descriptions ${lang}: empty or over 155 characters: ${longDesc.join('; ')}`);
      await v.ctx.close();
    }
  }
  // The beta page (owner 2026-10-08, for the 9 Oct PBIP post): English and Arabic on one URL, the request form's fields,
  // its beta_request event after a send, and no claim that 0.2.8 cannot keep ("until you say": nothing waits for a go)
  {
    const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), key = (home.match(/name="access_key" value="([^"]+)"/) || [])[1];
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser, { viewport: [1440, 900] }), tag = `power-bi-mcp ${lang}`;
      await v.pg.goto(`${url}/power-bi-mcp/?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(v.pg);
      const r = await v.pg.evaluate(() => {
        const f = document.getElementById('beta-form'), el = (n) => f && f.querySelector(`[name="${n}"]`);
        return { lang: document.documentElement.lang, dir: document.documentElement.dir, h1: document.querySelector('h1').textContent, title: document.title,
          text: document.body.innerText, action: f && f.getAttribute('action'), key: el('access_key') && el('access_key').value, subject: el('subject') && el('subject').value,
          fields: ['name', 'email', 'model', 'linkedin'].map((n) => [n, !!el(n), !!(el(n) && el(n).required), el(n) && el(n).labels.length]),
          join: !!document.querySelector('a[href="#join"]') && !!document.getElementById('join'), tools: document.querySelectorAll('#join, code').length };
      });
      checks++;
      if (lang === 'ar' && (r.lang !== 'ar' || r.dir !== 'rtl')) problems.push(`${tag}: lang=${r.lang} dir=${r.dir}, want ar and rtl`);
      if (lang === 'en' && (r.lang !== 'en' || r.dir === 'rtl')) problems.push(`${tag}: lang=${r.lang} dir=${r.dir}, want en, left to right`);
      if (lang === 'ar' && !/[\u0600-\u06FF]/.test(r.title + r.h1)) problems.push(`${tag}: title or heading not in Arabic`);
      if (lang === 'en' && r.title !== 'DataArcus for Power BI: private beta') problems.push(`${tag}: title is "${r.title}"`);
      if (r.action !== 'https://api.web3forms.com/submit' || !key || r.key !== key) problems.push(`${tag}: the form does not post to the home form's Web3Forms endpoint and key`);
      if (r.subject !== 'DataArcus for Power BI beta request') problems.push(`${tag}: hidden subject is "${r.subject}"`);
      for (const [n, has, req, labels] of r.fields) {
        if (!has || !labels) problems.push(`${tag}: form field ${n} missing or without a label`);
        else if (req !== (n !== 'linkedin')) problems.push(`${tag}: form field ${n} ${req ? 'required' : 'optional'}, want ${n === 'linkedin' ? 'optional' : 'required'}`);
      }
      if (!r.join) problems.push(`${tag}: no "Ask to join" link to #join`);
      if (r.tools < 9) problems.push(`${tag}: the 8 tools are not listed`);
      for (const claim of [/until you say/i, /until you approve/i, /nothing is written until/i, /plan first/i, /\bfirst\b[^.]{0,30}\b(tool|agent|mcp)\b/i, /\bonly (tool|agent|mcp)\b/i, /\b(AED|USD|\$)\s?\d/])
        if (claim.test(r.text)) problems.push(`${tag}: a claim it must not make: ${claim}`);
      // a sent request: Web3Forms answers 200 (stubbed by visitor()), then GA4 gets beta_request, not generate_lead
      await v.pg.evaluate(() => { window.__ev = []; window.gtag = (...a) => window.__ev.push(a); });
      await v.pg.fill('#beta-name', 'Test Person'); await v.pg.fill('#beta-email', 'test@example.com'); await v.pg.fill('#beta-model', 'A made-up sales model');
      await v.pg.click('#beta-form button[type="submit"]');
      const ev = await v.pg.waitForFunction(() => window.__ev.find((a) => a[0] === 'event' && /beta_request|generate_lead/.test(a[1])), null, { timeout: WAIT }).then((h) => h.jsonValue()).catch(() => null);
      checks++;
      if (!ev || ev[1] !== 'beta_request' || ev[2].form_id !== 'beta-form') problems.push(`${tag}: a sent request tracks ${ev ? ev[1] : 'nothing'}, want beta_request`);
      if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }

  // Home page part A (owner 2026-10-09): the hero and the menu lead to the beta page, the trust badges sit on one row at
  // 1440 with no empty band before the logo strip, the strip shows the owner's 4 tools under its label, the stats count
  // what the site really has, the FAQ answers the agent's data question, and the contact form says 1 working day
  {
    const blogCards = (fs.readFileSync(path.join(ROOT, 'blog.html'), 'utf8').match(/data-category=/g) || []).length;
    const dashboards = new Set(fs.readFileSync(path.join(ROOT, 'portfolio.html'), 'utf8').match(/href="dashboards\/[^"]+"/g) || []).size;
    const want = { en: { menu: 'AI Agent (beta)', label: 'Tools I work with', reply: 'Response within 1 working day', button: 'Try the AI agent (beta)' },
      ar: { menu: /[\u0600-\u06FF]/, label: 'أدوات أعمل بها', reply: /يوم عمل/, button: /[\u0600-\u06FF]/ } };
    const is = (v, w) => (w instanceof RegExp ? w.test(v || '') : (v || '').trim() === w);
    for (const lang of ['en', 'ar']) for (const vp of [[1440, 900], [390, 844]]) {
      const v = await visitor(browser, { viewport: vp }), tag = `home part A ${lang} ${vp[0]}px`, w = want[lang];
      await v.pg.goto(`${url}/index.html?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(v.pg);
      const r = await v.pg.evaluate(() => {
        const hero = document.getElementById('hero'), trust = document.querySelector('.hero-trust'), strip = document.querySelector('.tech-strip');
        const text = (sel) => (document.querySelector(sel) || {}).textContent;
        return {
          heroLinks: [...hero.querySelectorAll('a[href="/power-bi-mcp/"]')].map((a) => a.textContent.trim()),
          subtitleLink: !!hero.querySelector('.lead a[href="/power-bi-mcp/"]'),
          trustRows: trust ? new Set([...trust.children].map((c) => Math.round(c.getBoundingClientRect().top))).size : 0,
          trustSide: trust ? Math.max(...[...trust.children].map((c) => c.getBoundingClientRect().right)) <= innerWidth : false,
          gap: trust && strip ? Math.round(strip.getBoundingClientRect().top - trust.getBoundingClientRect().bottom) : null,
          logos: strip ? [...strip.querySelectorAll('img')].map((i) => i.getAttribute('src')) : [],
          label: strip && (strip.querySelector('.tech-strip-label') || {}).textContent,
          menu: (document.querySelector('#navmenu a[href="/power-bi-mcp/"]') || {}).textContent,
          reply: text('[data-i18n="contact.form.response"]'),
          ramadan: text('.tool-mini-cal'),
          repeatiq: text('[data-i18n="portfolio.cardRepeatiq.badge"]'),
          showcase: text('[data-i18n="portfolio.subtitle"]'),
          stats: [...document.querySelectorAll('#about [data-count]')].map((e) => +e.dataset.count),
          agentStat: !!document.querySelector('#about a[href="/power-bi-mcp/"]'),
          faq: [...document.querySelectorAll('#faq .accordion-body')].some((b) => b.querySelector('a[href="/power-bi-mcp/"]') && b.querySelector('a[href$="mcp/PRIVACY.md"]')),
          faqConnect: document.querySelector('#faq').innerHTML.includes('SQL')
        };
      });
      checks++;
      const bad = (m) => problems.push(`${tag}: ${m}`);
      if (!r.subtitleLink) bad('"private beta" in the hero line is not a link to /power-bi-mcp/');
      if (!r.heroLinks.some((t) => is(t, w.button))) bad(`no hero button "${w.button}" to /power-bi-mcp/ (${r.heroLinks.join(' | ')})`);
      if (vp[0] === 1440 && r.trustRows !== 1) bad(`the trust badges sit on ${r.trustRows} rows, want 1`);
      if (!r.trustSide) bad('a trust badge runs off the screen');
      if (vp[0] === 1440 && (r.gap === null || r.gap > 80)) bad(`${r.gap}px of empty space between the trust badges and the logo strip`);
      const names = r.logos.map((s) => s.split('/').pop());
      if (names.length !== 4 || names.some((n) => /sql|python/i.test(n))) bad(`logo strip shows ${names.join(', ')}, want Power BI, Excel, Azure and Fabric`);
      if (!is(r.label, w.label)) bad(`logo strip label is "${r.label}"`);
      if (!is(r.menu, w.menu)) bad(`menu item to /power-bi-mcp/ is "${r.menu}"`);
      if (!is(r.reply, w.reply)) bad(`contact reply time is "${r.reply}"`);
      if (!/1448/.test(r.ramadan || '') || /1447/.test(r.ramadan || '')) bad(`the calendar card shows "${r.ramadan}", want Ramadan 1448`);
      if (lang === 'en' && r.repeatiq !== 'E-COMMERCE & RETENTION') bad(`RepeatIQ badge is "${r.repeatiq}"`);
      if (lang === 'en' && !/^Explore my /.test(r.showcase || '')) bad(`showcases intro is not in the "I" voice: "${r.showcase}"`);
      if (r.stats[0] !== blogCards) bad(`articles stat ${r.stats[0]}, the blog lists ${blogCards}`);
      if (r.stats[2] !== dashboards) bad(`dashboard builds stat ${r.stats[2]}, the showcases page shows ${dashboards}`);
      if (!r.agentStat || r.stats[4] !== 1) bad('no stat "1 AI agent in private beta" linking to /power-bi-mcp/');
      if (!r.faq) bad('no FAQ answer linking /power-bi-mcp/ and mcp/PRIVACY.md');
      if (!r.faqConnect) bad('the FAQ\'s "I connect to" list lost SQL databases');
      // the phone menu still opens and shows the new item
      if (vp[0] < 992) {
        await v.pg.click('.navbar-toggler'); await v.pg.waitForTimeout(450);
        if (!await v.pg.locator('#navmenu a[href="/power-bi-mcp/"]').isVisible()) bad('the phone menu does not show the AI Agent item');
      }
      if (v.errs.length) bad(v.errs.join(' | '));
      await v.ctx.close();
    }
    // the longer menu still fits a small laptop: at 992 (the narrowest desktop menu) the call button stays on screen
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser, { viewport: [992, 800] });
      await v.pg.goto(`${url}/index.html?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(v.pg);
      const b = await v.pg.evaluate(() => { const r = document.querySelector('#navmenu .btn').getBoundingClientRect(); return [r.left, r.right, innerWidth]; });
      checks++; if (b[0] < 0 || b[1] > b[2]) problems.push(`home ${lang} 992px: the menu's call button runs off the screen (${Math.round(b[0])} to ${Math.round(b[1])})`);
      await v.ctx.close();
    }
    // every page with the menu has the item (the menu is the same on every page)
    for (const p of pages()) {
      const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
      if (html.includes('id="navmenu"') && !/<li class="nav-item"><a class="nav-link" href="\/power-bi-mcp\/" data-i18n="nav.agent">/.test(html)) problems.push(`${p}: the menu has no AI Agent (beta) item`);
      checks++;
    }
  }

  return { checks, problems };
}
