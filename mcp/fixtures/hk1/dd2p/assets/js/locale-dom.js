/*
 * DataArcus - the page's language in the DOM (0.3.2 SP36, moved from lang-manager.js): the translated elements, the
 * Arabic copy's links in translated HTML, the direction (with the Arabic fonts) and the meta tags. It changes the
 * document it is given and keeps no state of its own. Browser only (window.LocaleDom; locale-routes.js loaded first).
 *
 * Interface (each a document or element in, that document changed out; text(key) is the manager's lookup):
 *   translate(doc, { text, lang, arCopy, base }) -> every [data-i18n] element's text (a submit button's value, a
 *                      field's placeholder), every [data-i18n-html] element's HTML (on an Arabic copy, arCopy, its
 *                      links through arLinks from base, the English page's address), the data-i18n-placeholder, -alt,
 *                      -aria-label and -title attributes, then meta(doc, text, lang)
 *   arLinks(root, base) -> every href and src under root at its Arabic-copy address (locale-routes.js arAddress)
 *   direction(lang, rtlLanguages) -> <html dir> and <html lang>, body.rtl, and the Arabic font links (the whole font
 *                      for a right-to-left page, the switcher label's letters otherwise), on this page's document
 *   meta(doc, text, lang) -> <title>, description, keywords, author, Open Graph, Twitter, canonical and icon from the
 *                      page's meta key (or <html data-i18n-meta>); share previews follow the title and description,
 *                      og:locale the language; a page with hreflang links keeps its own canonical
 * (c) DataArcus. All rights reserved.
 */
(function (win) {
  'use strict';
  const R = () => win.LocaleRoutes;

  function translate(doc, { text: lookup, lang, arCopy, base }) {
    // Update all elements with data-i18n attribute
    doc.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = lookup(key);
      
      if (typeof text === 'string') {
        if (element.tagName === 'INPUT' && element.type === 'submit') {
          element.value = text;
        } else if (element.hasAttribute('placeholder')) {
          element.placeholder = text;
        } else {
          element.textContent = text;
        }
      }
    });
    
    // Update elements with data-i18n-html for HTML content
    doc.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      const html = lookup(key);
      if (typeof html === 'string') {
        element.innerHTML = html;
        if (arCopy) arLinks(element, base);
      }
    });
    
    // Translate attributes: data-i18n-placeholder, data-i18n-alt, data-i18n-aria-label and data-i18n-title
    // each name the key for that attribute, so inputs, images and buttons read in the page's language too
    ['placeholder', 'alt', 'aria-label', 'title'].forEach((attr) => {
      doc.querySelectorAll(`[data-i18n-${attr}]`).forEach((element) => {
        const text = lookup(element.getAttribute(`data-i18n-${attr}`));
        if (typeof text === 'string') element.setAttribute(attr, text);
      });
    });

    // Update meta tags
    meta(doc, lookup, lang);
  }

  function arLinks(root, base) {
    root.querySelectorAll('[href], [src]').forEach((e) => ['href', 'src'].forEach((a) => {
      const v = e.getAttribute(a);
      if (v === null) return;
      const to = R().arAddress(v, a === 'href' && e.tagName === 'A', base);
      if (to !== null) e.setAttribute(a, to);
    }));
  }

  // Update text direction and HTML attributes
  function direction(lang, rtlLanguages) {
    const isRTL = rtlLanguages.includes(lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Arabic font: Inter has no Arabic letters, so load IBM Plex Sans Arabic on demand
    if (isRTL && !document.getElementById('ar-font')) {
      const font = document.createElement('link');
      font.id = 'ar-font';
      font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap';
      document.head.appendChild(font);
    }
    // English pages still show Arabic words: the switcher's label. Without the Arabic font the phone draws them
    // in its own system font, which sits lower than the icon. Load only the letters of those words (a few KB).
    if (!isRTL && !document.getElementById('ar-font-label')) {
      const label = document.createElement('link');
      label.id = 'ar-font-label';
      label.rel = 'stylesheet';
      label.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;600&display=swap&text=' + encodeURIComponent('عربي العربية');
      document.head.appendChild(label);
    }

    // Add/remove RTL class
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }

  // Update meta tags for SEO
  function meta(doc, lookup, lang) {
    // pages without their own translation file (404) name their meta key on <html data-i18n-meta="...">
    const found = lookup(doc.documentElement.getAttribute('data-i18n-meta') || 'meta');
    if (typeof found === 'object') {
      // Share previews follow the page: og:/twitter: title and description default to the page's own, and
      // og:locale to its language, so a page only needs a title and a description in each language
      const metaData = Object.assign({}, found);
      const has = (sel) => !!doc.querySelector(sel);
      [['title', 'og:title', 'twitter:title'], ['description', 'og:description', 'twitter:description']].forEach(([base, og, tw]) => {
        if (!metaData[base]) return;
        if (!metaData[og] && has(`meta[property="${og}"]`)) metaData[og] = metaData[base];
        if (!metaData[tw] && has(`meta[name="${tw}"]`)) metaData[tw] = metaData[og] || metaData[base];
      });
      if (has('meta[property="og:locale"]')) metaData['og:locale'] = lang === 'ar' ? 'ar_AE' : 'en_US';
      // Update <title>
      if (metaData.title) {
        doc.title = metaData.title;
      }
      // a page with its own Arabic copy (hreflang links) has its canonical in its file: each copy names itself
      if (doc.querySelector('link[rel="alternate"][hreflang]')) delete metaData.canonical;

      // Loop through all meta properties
      Object.entries(metaData).forEach(([key, value]) => {
        if (!value) return;
        if (key === 'title') return; // Already handled

        // Handle standard meta tags
        let selector, attr;
        if (key === 'description' || key === 'keywords' || key === 'author') {
          selector = `meta[name="${key}"]`;
          attr = 'content';
        }
        // Handle Open Graph tags
        else if (key.startsWith('og:')) {
          selector = `meta[property="${key}"]`;
          attr = 'content';
        }
        // Handle Twitter tags
        else if (key.startsWith('twitter:')) {
          selector = `meta[name="${key}"]`;
          attr = 'content';
        }
        // Handle canonical link
        else if (key === 'canonical') {
          selector = 'link[rel="canonical"]';
          attr = 'href';
        }
        // Handle favicon
        else if (key === 'icon') {
          selector = 'link[rel="icon"]';
          attr = 'href';
        }
        // Add more custom cases as needed

        if (selector) {
          let tag = doc.querySelector(selector);
          if (!tag) {
            // Create tag if it doesn't exist
            if (selector.startsWith('meta')) {
              tag = doc.createElement('meta');
              if (selector.includes('property')) {
                tag.setAttribute('property', key);
              } else if (selector.includes('name')) {
                tag.setAttribute('name', key);
              }
              doc.head.appendChild(tag);
            } else if (selector.startsWith('link')) {
              tag = doc.createElement('link');
              if (key === 'canonical') tag.setAttribute('rel', 'canonical');
              if (key === 'icon') tag.setAttribute('rel', 'icon');
              doc.head.appendChild(tag);
            }
          }
          tag.setAttribute(attr, value);
        }
      });
    }
  }

  win.LocaleDom = Object.freeze({ translate, arLinks, direction, meta });
})(typeof window !== 'undefined' ? window : globalThis);
