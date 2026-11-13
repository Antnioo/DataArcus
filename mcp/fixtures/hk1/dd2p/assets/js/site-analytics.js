/*
 * DataArcus analytics adapter (0.3.2 SP35: main.js sections 7 and 9). The only site file that calls gtag or Clarity
 * or touches the consent loader's window.daConsent (scripts/tests/sp35.mjs M2): trackers load only from the consent
 * loader in each page's <head> after consent, and every call here is guarded, so a blocked tracker breaks nothing.
 *
 * Interface: window.SiteAnalytics.
 *   init()            main.js calls it once at script time. Sets window.dataArcusTrack and listens: the click
 *                     listener (contact_click, mcp_download_click, cta_click, outbound_click: the link's host and
 *                     path only), each form's first focus (form_start),
 *                     the dashboards (dashboard_view, dashboard_engage), an article read (75% and 30 s), the
 *                     language switch, the blog's search (safeTerm: no e-mail or phone number) and filters, an AI
 *                     assistant's referral, and two events other files send with only these fields read:
 *                     'dataarcus:lead' { formId } (site-forms.js: generate_lead, or beta_request for the beta form)
 *                     and 'dataarcus:embed' { dashboard } (site-navigation.js: dashboard_live_load, once).
 *   window.dataArcusTrack(name, params)  (set by init(), for the tools' pages) = track: gtag('event', name,
 *                     { page_type, ...params }) and clarity('event', name), each only when present.
 *   banner()          main.js calls it once at script time, after init(): the cookie banner (shown to visitors in
 *                     Europe by time zone, or by "Cookie settings"): Accept saves 'granted', calls daConsent.load()
 *                     and tells Clarity; Reject saves 'denied', tells gtag and Clarity, clears their cookies.
 */
window.SiteAnalytics = (() => {

  /**
   * 7. Analytics Events (GA4 + Clarity)
   * ==================================================================
   * Sends named events so GA4 shows what visitors DO, not just page views.
   * Everything is guarded: if an ad blocker removes gtag or Clarity,
   * nothing breaks. Event names follow GA4 conventions where one exists.
   * Mark "generate_lead" as a Key Event in GA4 (Admin > Events).
   * ==================================================================
   */
  const init = () => {
    // (an Arabic copy, /ar/..., is the same page type as its English page; page_location tells them apart)
    const page = location.pathname.replace(/^\/ar(?=\/)/, '').replace(/\/index\.html$/, '/') || '/';
    const pageType = page.includes('/articles/') ? 'article'
      : page.includes('/dashboards/') ? 'dashboard'
      : page.includes('/tools/') ? 'tool'
      : page.replace(/^\//, '').replace('.html', '') || 'home';

    // Never name a parameter source, medium, campaign, term or content: GA4 reads those as the visit's traffic source
    // and overwrites where the visitor came from (R-003). scripts/test-analytics-events.mjs checks every call.
    const track = (name, params = {}) => {
      const payload = { page_type: pageType, ...params };
      try { if (typeof window.gtag === 'function') window.gtag('event', name, payload); } catch (e) { /* ignore */ }
      try { if (typeof window.clarity === 'function') window.clarity('event', name); } catch (e) { /* ignore */ }
    };
    window.dataArcusTrack = track; // lets tool pages send their own events
    // Typed text that looks like an email address or a phone number never reaches GA4 (no personal data in analytics)
    // AUD-031 (round 20): 7 or more digits in all is a phone or an ID (a Gulf mobile is 8 digits, "5512 3456"), unless
    // every number in the term is a year ("2024 2025"); an "@" is an e-mail; anything else is cut to 50 characters.
    // Round 22 (the code review's i): the years a search names (2015 to 2035) are set aside, then 7 or more digits are
    // redacted: "2024 2025 top 10" is kept, "2012 1995" (as likely a phone number) is not.
    // Round 22b (the review of round 22, item 1: "050 2024 2025" and "+971 50 2030 2015" got through, their groups read as
    // years; the second review, items 1, 6, 7: no regex lookbehind, which Safari before 16.4 cannot parse and so drops the
    // whole file; commas, underscores or one letter between numbers join them too; order does not matter). The numbers of
    // a term are read in runs: numbers joined by anything but a word of two or more letters ("050,2024,2025", "050x2024").
    // A run counts the digits of its numbers that are not years (2015 to 2035), or all its digits when those are 4 or more
    // ("5520 2025") or the run starts with + or 0 ("050 2025"). 7 or more counted digits in a run, or in the whole term,
    // are redacted. So "2024 2025 top 10", "dp-600 2025" and "fy2024 vs fy2025" are kept. The third review (items 5, 6): a
    // number of 3 or more digits beside two or more years counts whole ("971 2030 2015"), and Arabic-Indic and Eastern
    // Arabic digits are read as digits ("٠٥٠١٢٣٤٥٦٧"); a kept term is sent as typed.
    // The reviewer's final items 1 to 3: the term is read in its NFKC form (fullwidth digits and at-signs as ASCII), and
    // any other script's digit counts as a non-year digit; an exam or product code ("pl-300", "dp-600") is no part of a run;
    // a number of 1 or 2 digits right after a word ("top 10") stands alone; a run of two or more years with 2 or more
    // other digits counts whole ("50 2025 2030", "55 2024 2025 1").
    const safeTerm = (q) => { const d = q.normalize('NFKC').replace(/[\u0660-\u0669]/g, (x) => x.charCodeAt(0) - 0x660).replace(/[\u06f0-\u06f9]/g, (x) => x.charCodeAt(0) - 0x6f0).replace(/\p{Nd}/gu, (x) => (/[0-9]/.test(x) ? x : '9')); if (d.includes('@')) return '(redacted)'; const Y = /^20(1[5-9]|2\d|3[0-5])$/, p = d.split(/(\d+)/), runs = []; let run = null, sum = 0; for (let i = 1; i < p.length; i += 2) { const gap = p[i - 1]; if (/\p{L}-$/u.test(gap)) { run = null; continue; } const lone = p[i].length <= 2 && /\p{L}\s+$/u.test(gap); if (!run || run.lone || lone || (gap.match(/\p{L}/gu) || []).length > 1) runs.push(run = { pre: /\+\s*$/.test(gap), g: [], lone }); run.g.push(p[i]); } for (const r of runs) { const all = r.g.join('').length, others = r.g.filter((x) => !Y.test(x)), other = others.join('').length, c = r.pre || r.g[0][0] === '0' || other >= 4 || (r.g.length - others.length >= 2 && other >= 2) ? all : other; if (c >= 7) return '(redacted)'; sum += c; } return sum >= 7 ? '(redacted)' : q.slice(0, 50); };

    const once = new Set();
    const trackOnce = (key, name, params) => { if (once.has(key)) return; once.add(key); track(name, params); };

    // --- AI assistants (22 Oct 2026, the owner: "making sure AI refers us"): a visit an assistant sent, by its referrer or
    //     the utm_source it adds, is named once, by the assistant only: a Clarity tag (each recording then says who sent
    //     the visitor) and the GA4 event ai_referral with the landing page's path. Never the referrer's address: a chat
    //     link can carry a conversation id. Consent works as for every other event (track and Clarity's own queue).
    const aiSourceOf = (ref, search) => { const hosts = [['chatgpt', /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/], ['perplexity', /(^|\.)perplexity\.ai$/], ['claude', /(^|\.)claude\.ai$/], ['gemini', /(^|\.)(gemini|bard)\.google\.com$/], ['copilot', /(^|\.)(copilot\.microsoft\.com|copilot\.cloud\.microsoft|edgeservices\.bing\.com)$/], ['you', /(^|\.)you\.com$/], ['phind', /(^|\.)phind\.com$/], ['poe', /(^|\.)poe\.com$/], ['meta', /(^|\.)meta\.ai$/], ['deepseek', /(^|\.)deepseek\.com$/], ['grok', /(^|\.)(grok\.com|x\.ai)$/], ['mistral', /(^|\.)mistral\.ai$/], ['kagi', /(^|\.)kagi\.com$/]]; const byHost = (h) => { const m = hosts.find(([, re]) => re.test(String(h || '').toLowerCase())); return m ? m[0] : null; }; let host = ''; try { host = ref ? new URL(ref).hostname : ''; } catch (e) { host = ''; } const utm = (new URLSearchParams(search || '').get('utm_source') || '').toLowerCase().replace(/^https?:\/\//, '').split('/')[0]; return byHost(host) || byHost(utm) || (hosts.some(([n]) => n === utm) ? utm : null); };
    const aiSource = aiSourceOf(document.referrer, location.search);
    if (aiSource && !(document.referrer && new URL(document.referrer, location.href).hostname === location.hostname)) {
      try { if (typeof window.clarity === 'function') { window.clarity('set', 'ai_source', aiSource); window.clarity('set', 'ai_landing', location.pathname.slice(0, 100)); } } catch (e) { /* ignore */ }
      trackOnce('ai_referral', 'ai_referral', { ai_source: aiSource, landing_path: location.pathname.slice(0, 100) });
    }

    // --- Leads: fired by site-forms.js (the event dataarcus:lead) after a successful send
    // (the beta page's request form is its own event, beta_request, so the home form's generate_lead keeps its meaning)
    document.addEventListener('dataarcus:lead', (e) => {
      const formId = (e.detail && e.detail.formId) || 'unknown';
      if (formId === 'beta-form') track('beta_request', { form_id: formId });
      else track('generate_lead', { form_id: formId });
    });

    // --- Form funnel: first interaction with a form (started but maybe not sent)
    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('focusin', () => trackOnce('form_start:' + form.id, 'form_start', { form_id: form.id || 'form' }), { once: true });
    });

    // --- Clicks: CTAs, email/phone/WhatsApp, outbound links
    const RELEASE_LINK = /^https:\/\/github\.com\/Antnioo\/dataarcus-releases\/releases\b/i;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const text = (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 60);

      if (/^mailto:/i.test(href)) return track('contact_click', { method: 'email', link_text: text });
      if (/^tel:/i.test(href)) return track('contact_click', { method: 'phone', link_text: text });
      if (/wa\.me|whatsapp\.com/i.test(href)) return track('contact_click', { method: 'whatsapp', link_text: text });

      // a DataArcus release (the MCP page's "Download 0.3.0"): its own event, so downloads from the site are counted by
      // name and can be a GA4 key event (22 Oct 2026); the tag only, never the file's address
      if (RELEASE_LINK.test(href)) {
        return track('mcp_download_click', { release_tag: (/\/tag\/(v[\w.-]+)/.exec(href) || [])[1] || 'latest', link_text: text });
      }
      if (/#contact\b/.test(href) || a.classList.contains('btn-accent')) {
        return track('cta_click', { cta_text: text, cta_target: href });
      }

      // (Y-02, an outside review, the owner's yes, 8 Oct 2026: link_url was the whole address, its query string, fragment
      // and any user:password part with it; now the host without www. and the path only)
      const outboundUrl = (url) => (url.hostname.replace(/^www\./, '') + url.pathname).slice(0, 100);
      try {
        const url = new URL(href, location.href);
        if (url.hostname && url.hostname !== location.hostname && /^https?:$/.test(url.protocol)) {
          track('outbound_click', { link_domain: url.hostname.replace(/^www\./, ''), link_url: outboundUrl(url), link_text: text });
        }
      } catch (err) { /* ignore bad URLs */ }
    }, { capture: true });

    // --- Showcases: a live report opened (site-navigation.js sends the event; only the dashboard's title is read)
    document.addEventListener('dataarcus:embed', (e) => trackOnce('dash_live', 'dashboard_live_load', { dashboard: String((e.detail && e.detail.dashboard) || '') }));

    // --- Dashboards: a click into the Power BI iframe blurs the window.
    //     Page loads alone don't count; this means someone actually used it.
    const pbiFrames = document.querySelectorAll('iframe[src*="powerbi.com"], [data-pbi-src]');
    if (pbiFrames.length) {
      const title = document.title.replace(/\s*-\s*DataArcus\s*$/, '');
      trackOnce('dash_view', 'dashboard_view', { dashboard: title });
      window.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
            trackOnce('dash_engage', 'dashboard_engage', { dashboard: title });
          }
        }, 0);
      });
    }

    // --- Articles: "read" = 75% scrolled AND 30 seconds on the page
    if (pageType === 'article') {
      const article = document.title.replace(/\s*-\s*DataArcus\s*$/, '');
      let deepScroll = false, longEnough = false;
      const check = () => { if (deepScroll && longEnough) trackOnce('read', 'article_read', { article }); };
      setTimeout(() => { longEnough = true; check(); }, 30000);
      const onScroll = () => {
        const h = document.documentElement;
        const pct = (h.scrollTop + window.innerHeight) / h.scrollHeight;
        if (pct >= 0.75) { deepScroll = true; check(); window.removeEventListener('scroll', onScroll); }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // --- Language switch: watch the <html lang> attribute the language manager sets
    let lastLang = document.documentElement.lang;
    new MutationObserver(() => {
      const lang = document.documentElement.lang;
      if (lang && lang !== lastLang) { lastLang = lang; track('language_switch', { language: lang }); }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    // --- Blog: what people search for and which filters they use
    const blogSearch = document.getElementById('blogSearch');
    if (blogSearch) {
      let t;
      blogSearch.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { const q = blogSearch.value.trim(); if (q.length >= 3) track('search', { search_term: safeTerm(q) }); }, 1500);
      });
    }
    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => track('blog_filter', { filter: btn.getAttribute('data-filter') }));
    });
  };

  /**
   * 9. Cookie Banner
   * ==================================================================
   * Works with the consent loader in each page's <head> (window.daConsent).
   * Shown automatically only to visitors in Europe (by time zone).
   * Accept loads Google Analytics and Clarity; Reject stops them and clears
   * their cookies. The choice is remembered; the privacy page can reopen it.
   * ==================================================================
   */
  const banner = () => {
    const C = window.daConsent;
    if (!C) return;
    const t = () => { const all = window.commonTranslations || {}; return (all[document.documentElement.lang === 'ar' ? 'ar' : 'en'] || {}).consent || {}; };
    const privacyLink = document.querySelector('[data-i18n="footer.links.privacy"]');
    const privacyHref = privacyLink ? privacyLink.getAttribute('href') : '/privacy.html';
    let bar = null;
    // An explicit Accept tells Clarity, which needs the signal for visitors in the EEA, UK and Switzerland to follow a visit
    // across pages. Ads stay denied: the site runs no Microsoft ads. Visitors who never saw the banner send nothing (as before).
    const clarityGranted = () => { try { if (typeof window.clarity === 'function') window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); } catch (e) { /* ignore */ } };

    const save = (v) => { C.choice = v; try { localStorage.setItem(C.key, v); } catch (e) { /* private mode: asks again next visit */ } };
    const clearCookies = () => {
      const host = location.hostname, parts = host.split('.');
      const domains = ['', host, '.' + host, parts.length > 1 ? '.' + parts.slice(-2).join('.') : ''];
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim();
        if (!/^(_ga|_gid|_gat|_clck|_clsk|CLID|ANONCHK|MR|MUID|SM)/.test(name)) return;
        domains.forEach((d) => { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : ''); });
      });
    };
    const fill = () => {
      if (!bar) return;
      const x = t();
      bar.setAttribute('aria-label', x.label || 'Cookie choice');
      bar.querySelector('.cc-text').innerHTML = (x.text || 'We use analytics cookies to understand how the site is used and to improve it.') +
        ' <a href="' + privacyHref + '">' + (x.more || 'Privacy policy') + '</a>';
      bar.querySelector('[data-cc="accept"]').textContent = x.accept || 'Accept';
      bar.querySelector('[data-cc="reject"]').textContent = x.reject || 'Reject';
    };
    const hide = () => { if (bar) bar.remove(); bar = null; document.body.style.removeProperty('--cc-h'); document.body.classList.remove('cc-open'); };
    const show = () => {
      if (bar) return;
      bar = document.createElement('div');
      bar.className = 'cc-bar';
      bar.setAttribute('role', 'region');
      bar.innerHTML = '<p class="cc-text"></p><div class="cc-btns"><button type="button" class="btn btn-glass" data-cc="reject"></button><button type="button" class="btn btn-accent" data-cc="accept"></button></div>';
      fill();
      document.body.appendChild(bar);
      document.body.classList.add('cc-open');
      document.body.style.setProperty('--cc-h', bar.offsetHeight + 'px');   // lifts the WhatsApp button above the bar
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cc]'); if (!b) return;
        if (b.dataset.cc === 'accept') { save('granted'); C.load(); clarityGranted(); }
        else {
          save('denied');
          try { if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: 'denied' }); } catch (err) { /* ignore */ }
          try { if (typeof window.clarity === 'function') window.clarity('consent', false); } catch (err) { /* ignore */ }
          clearCookies();
        }
        hide();
      });
    };
    C.open = show;   // "Cookie settings" on the privacy page
    if (C.choice === 'granted') clarityGranted();   // a visitor who accepted on an earlier page
    if (C.eu && C.choice !== 'granted' && C.choice !== 'denied') show();
    document.querySelectorAll('[data-cc-open]').forEach((b) => b.addEventListener('click', show));
    new MutationObserver(fill).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  };

  return { init, banner };
})();
