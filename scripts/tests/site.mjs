// Every page, in English and Arabic, on a phone and a laptop:
// no errors, no missing translations, no sideways scrolling, nothing marked hidden on screen, the phone menu opens,
// and the top offset (style.css --top-offset) matches the real navbar.
import fs from 'node:fs';
import path from 'node:path';
import { pages, visitor, ROOT, ready } from './lib.mjs';

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
  // animated numbers reach their value once scrolled into view, also on a short screen (a phone held sideways)
  for (const p of pages().filter((p) => fs.readFileSync(path.join(ROOT, p), 'utf8').includes('data-count='))) {
    const v = await visitor(browser, { viewport: [844, 390] });
    await v.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' });
    const n = await v.pg.locator('[data-count]').count();
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
  return { checks, problems };
}
