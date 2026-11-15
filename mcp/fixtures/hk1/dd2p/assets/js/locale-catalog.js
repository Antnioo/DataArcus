/*
 * DataArcus - the translation catalog (0.3.2 SP36, moved from lang-manager.js): the site's dictionaries loaded and
 * merged (the common one, then the page's own over it), and a key looked up in them.
 * Pure: no page, no storage, no network, no state; it never changes what it is given (each answer is a new object).
 * Browser (window.LocaleCatalog) and Node.
 *
 * Interface (one input, one output each):
 *   load(common, page, current = {}) -> the dictionaries: a copy of common (or of current when there is none), with
 *                      page merged over it when there is one; each is { <lang>: { <key>: text | { ... } } }
 *   merge(translations, page) -> translations with page merged over it, language by language (deepMerge)
 *   deepMerge(target, source) -> target with source over it: plain objects merged key by key, anything else (text,
 *                      a number, an array, null) replaced
 *   text(translations, lang, path, warn) -> the value at the dotted key path in that language, or "[Missing: path]"
 *                      when it is absent or empty; warn(message) is called when the path runs through a value that is
 *                      not an object (the manager passes console.warn)
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  function deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }

  function merge(translations, page) {
    const out = { ...translations };
    for (const lang in page) out[lang] = deepMerge(out[lang] || {}, page[lang]);
    return out;
  }

  function load(common, page, current = {}) {
    const base = common ? { ...common } : { ...current };
    return page ? merge(base, page) : base;
  }

  function text(translations, lang, path, warn) {
    const keys = path.split('.');
    let value = translations[lang];

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        if (warn) warn(`Translation missing: ${path} for language: ${lang}`);
        return `[Missing: ${path}]`;
      }
    }

    return value || `[Missing: ${path}]`;
  }

  const api = Object.freeze({ load, merge, deepMerge, text });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LocaleCatalog = api;
})(typeof self !== 'undefined' ? self : this);
