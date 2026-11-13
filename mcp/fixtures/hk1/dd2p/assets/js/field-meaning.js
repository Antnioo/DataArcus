/*
 * DataArcus field meaning: what a measure's or column's metadata says it holds (a percent, money, a count, text),
 * one rule for the field picker (pbip-bind.js) and the health check's format rules (model-health-tmdl.js), which had
 * drifted apart (the block audit of 11 Oct 2026, A1-11: "Corporate Revenue" and "Generated Leads" became 0.0% cards,
 * because the picker tested "rate" without word boundaries). Metadata only: names, format strings, DAX text; never data.
 * A format string decides first where a caller asks for it; a name alone counts only by whole words, and never for a
 * name the NOT_PCT list knows ("Exchange Rate", "Hourly Rate", "Price per Unit").
 * (c) DataArcus. All rights reserved.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DataArcusFieldMeaning = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // a format string without its quoted text and escaped characters
  const unquoted = (f) => String(f || '').replace(/"[^"]*"/g, '').replace(/\\./g, '');
  // the DAX divides (DIVIDE or /, not a // comment)
  const DIVIDES = /\bDIVIDE\s*\(|(^|[^/])\/(?!\/)/i;
  const divides = (expr) => DIVIDES.test(Array.isArray(expr) ? expr.join('\n') : String(expr == null ? '' : expr));
  // a percent by name: a % sign, or the whole words pct, percent(age), ratio, rate, Arabic نسبة; margin, share, vs,
  // growth and change only when the DAX divides (they are money as often: "Total Margin" = SUM)
  const PCT_HARD = /%|\bpct\b|\bpercent(age)?\b|\bratio\b|\brate\b|نسبة/i, PCT_SOFT = /\bmargin\b|\bshare\b|\bvs\b|\bgrowth\b|\bchange\b|هامش|نمو/i;
  // names that hold one of those words and are no percent
  const NOT_PCT = /hourly|exchange|run\s*rate|\bper\b|colou?r|icon|label|title|arrow/i;
  const formatHasPercent = (f) => /%/.test(unquoted(f));
  // a number format: digits in the format (not a text-only one such as "Yes";"No")
  const isNumberFormat = (f) => /[0#]/.test(unquoted(f)) || /^\s*(general( number)?|currency|fixed|standard|percent|scientific)\s*$/i.test(String(f || ''));
  // opt: { divides, format, soft: 'noFormat' (the picker: a soft word counts only without a format) | 'notMoney' (the
  // health check: only when the format is not money) }
  const percentFromName = (name, opt) => {
    const n = String(name == null ? '' : name), o = opt || {};
    if (PCT_HARD.test(n) && !NOT_PCT.test(n)) return true;
    if (!PCT_SOFT.test(n) || !o.divides) return false;
    return o.soft === 'notMoney' ? !hasCurrency(o.format) : !String(o.format || '').trim();
  };
  // A currency in a format string: an ISO 4217 code ("EUR" #,0, #,0 "INR") or a currency sign ($, €, £, ¥, ₹, the Gulf's
  // د.إ ر.س ...), or the named format Currency; a unit ("kg", "pcs") is none (the cross-review's G2, 11 Oct)
  const ISO4217 = 'AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWL'.split(' ');
  const CURRENCY_SIGN = /\\?[$€£¥₹₩₽₺₪₫฿₦₱₴₸₼₾﷼]|\[\$|د\.إ|ر\.س|ر\.ق|د\.ك|د\.ب|ر\.ع|ج\.م/;
  const quotedOf = (f) => (String(f || '').match(/"[^"]*"|\\./g) || []).map((q) => q.replace(/^"|"$/g, '').replace(/^\\/, '').trim());
  const isoIn = (q) => q.split(/[\s.]+/).some((w) => ISO4217.includes(w.toUpperCase()));
  const hasCurrency = (f) => /^\s*currency\s*$/i.test(String(f || '')) || CURRENCY_SIGN.test(String(f || '')) || quotedOf(f).some(isoIn);
  const hasUnit = (f) => quotedOf(f).some((q) => q && /[A-Za-z؀-ۿ]/.test(q) && !isoIn(q) && !CURRENCY_SIGN.test(q));
  // text, never a number: a format of quoted words only, Yes/No, True/False, On/Off; or DAX that returns text
  const isTextFormat = (f) => { if (!f) return false; if (/^\s*(yes\/no|true\/false|on\/off)\s*$/i.test(f)) return true; if (/^\s*(general( number)?|currency|fixed|standard|percent|scientific)\s*$/i.test(f)) return false; return !/[0#%]/.test(unquoted(f)); };
  const TEXT_EXPR = /^\s*"|^\s*(FORMAT|CONCATENATEX?|UNICHAR|UPPER|LOWER|LEFT|RIGHT|MID|SUBSTITUTE|REPT|COMBINEVALUES)\s*\(|"\s*&|&\s*"|\b(IF|SWITCH)\s*\([\s\S]*,\s*"[^"]*"\s*\)\s*$/i;
  // a measure that counts: its DAX counts rows or values anywhere (COUNTS), or starts with a count (COUNT_EXPR)
  const COUNTS = /\b(COUNTROWS|DISTINCTCOUNT(NOBLANK)?|COUNTA?X?|COUNTBLANK)\s*\(/i;
  const COUNT_EXPR = /^(COUNT|COUNTA|COUNTAX|COUNTBLANK|COUNTROWS|COUNTX|DISTINCTCOUNT|DISTINCTCOUNTNOBLANK)\s*\(/i;
  // ---------- the format rule (builder 7's audit A3-3, 11 Oct: it lived in model-health-tmdl.js, the server re-decided
  // a card's format after the picker, and the picker had a third rule; one rule now, for the health check's script, the
  // picker's cards and tables, and both downloads) ----------
  // A number format without a thousand separator shows 13857, not 13,857. lacksSeparator(format): a custom number
  // format (digit placeholders 0 or #) with no "," before the decimal point. Never true for a percentage, a date or
  // time format, scientific notation, text, a named format, or no format at all.
  function lacksSeparator(format) {
    if (format == null || !String(format).trim()) return false;
    const f = unquoted(format);
    if (!/[0#]/.test(f) || /%/.test(f) || /e[+-]/i.test(f) || /[dmyhs]/i.test(f) || /^[a-z ]+$/i.test(f.trim())) return false;
    return f.split(';').some((sec) => /[0#]/.test(sec) && !/,/.test(sec.split('.')[0]));
  }
  // the same format with the separator: each section's whole-number part becomes #,0 ("0.00" -> "#,0.00")
  function withSeparator(format) {
    let quoted = false;
    // split into sections at ";" outside quotes, then replace the first run of digit placeholders of each
    const secs = []; let cur = '';
    for (const ch of String(format)) { if (ch === '"') quoted = !quoted; if (ch === ';' && !quoted) { secs.push(cur); cur = ''; } else cur += ch; }
    secs.push(cur);
    return secs.map((sec) => {
      if (/,/.test(unquoted(sec).split('.')[0]) || !/[0#]/.test(unquoted(sec))) return sec;
      let q = false, done = false, out = '';
      for (let i = 0; i < sec.length; i++) {
        const ch = sec[i];
        if (ch === '"') q = !q;
        if (!q && !done && (ch === '0' || ch === '#')) { let j = i; while (j < sec.length && (sec[j] === '0' || sec[j] === '#')) j++; out += '#,0'; i = j - 1; done = true; } else out += ch;
      }
      return out;
    }).join(';');
  }
  // Columns that are identifiers or parts of a date, by name: a separator would be wrong on them (2,026)
  const NOT_A_QUANTITY = /year|month|day|week|quarter|hijri|(^|[\s_-])(id|key|code|no|num|number|index|sort|order|rank|zip|postal|phone|mobile)s?$|[a-z]ID$|Key$|السنة|الشهر|اليوم|رقم/i;
  // The right format of a measure or a column (the owner's ask, 6 Oct 2026: formats fixed at the source). formatOf(obj,
  // kind, tables) returns null when the object is left alone (already well formatted, a format expression, text, or not
  // a number or date), else { format, reason }:
  //   a percentage (a % in the format or the name, ratio, rate, pct, percent; or margin, share, vs, growth, change
  //     when the DAX divides and the format is not money): "0.0%", unless its format already has a %
  //   a whole number or a count (COUNT..., a sum of a whole-number column, a whole-number column): "#,0"
  //   money (a currency in the format): the model's own format, with the thousand separator added where it lacks one;
  //     a currency is never invented
  //   a sum without a format: "#,0" (round 14); any other number: "#,0.00" without a format; its own format with the
  //     separator where it lacks one
  //   a date column: "dd mmm yyyy" without a format or with "General Date" (which shows a time of 12:00:00 AM)
  // obj: { name, formatString, formatStringDefinition, expression } for a measure, { name, formatString, dataType,
  // summarizeBy, isHidden } for a column; tables: the model's, [{ name, columns: [{ name, dataType }] }]
  const hasDecimals = (f) => /\.[0#]/.test(unquoted(f));
  const sumOfWhole = (expr, rawTables) => {
    const sum = expr.match(/^SUM\s*\(\s*'?([^'\[\]]+?)'?\s*\[\s*([^\]]+)\]\s*\)$/i); if (!sum) return false;
    const t = (rawTables || []).find((x) => x.name.toLowerCase() === sum[1].trim().toLowerCase()), c = t && (t.columns || []).find((x) => x.name.toLowerCase() === sum[2].trim().toLowerCase());
    return !!(c && c.dataType === 'int64');
  };
  // the right format of a number whose kind is known: whole (a count) or not
  // (round 14, the laptop's proof on 6 Oct: the sample's unformatted SUM showed 14,178.00 in its table, where round 13
  // showed 14,178): a sum the model leaves without a format shows no decimals, as a count does; only a real decimal
  // (an average, a division, any other DAX) gets two; a sum the model formats with decimals keeps them
  const numberFix = (f, whole, sum) => {
    if (hasCurrency(f || '')) return lacksSeparator(f) ? { format: withSeparator(f), reason: 'money: the model\'s own currency format, with the thousand separator' } : null;
    if (whole) return !f || hasDecimals(f) || lacksSeparator(f) || /^\s*general( number)?\s*$/i.test(f) ? { format: '#,0', reason: f && hasDecimals(f) ? 'a count or whole number shown with decimals (' + f + ')' : 'a count or whole number: thousand separator, no decimals' } : null;
    if (!f && sum) return { format: '#,0', reason: 'a sum without a format: thousand separator, no decimals' };
    if (!f) return { format: '#,0.00', reason: 'a number without a format: thousand separator and two decimals' };
    return lacksSeparator(f) ? { format: withSeparator(f), reason: 'the format has no thousand separator (' + f + ')' } : null;
  };
  function formatOf(obj, kind, rawTables) {
    if (!obj) return null;
    const f = obj.formatString == null ? '' : String(obj.formatString).trim(), nm = String(obj.name || '');
    if (kind === 'column') {
      const type = String(obj.dataType || '').toLowerCase();
      if (obj.isHidden || obj.type === 'rowNumber') return null;
      if (type === 'datetime') return /time|stamp|hour/i.test(nm) || (f && !/^\s*general date\s*$/i.test(f)) ? null : { format: 'dd mmm yyyy', reason: f ? 'a date shown with a time (General Date)' : 'a date without a format' };
      if (!/^(int64|double|decimal)$/.test(type) || obj.summarizeBy === 'none' || NOT_A_QUANTITY.test(nm) || PCT_HARD.test(nm) || isTextFormat(f)) return null;
      return numberFix(f, type === 'int64');
    }
    if (obj.formatStringDefinition) return null;
    const expr = (Array.isArray(obj.expression) ? obj.expression.join('\n') : obj.expression == null ? '' : String(obj.expression)).replace(/\/\/.*$/gm, '').replace(/--.*$/gm, '').trim();
    if (isTextFormat(f) || TEXT_EXPR.test(expr)) return null;
    const pct = formatHasPercent(f) || percentFromName(nm, { divides: DIVIDES.test(expr), format: f, soft: 'notMoney' });
    if (pct) return /%/.test(unquoted(f)) ? null : { format: '0.0%', reason: f ? 'a ratio (by its name or its DAX) formatted as ' + f : 'a ratio (by its name or its DAX) without a format' };
    return numberFix(f, COUNT_EXPR.test(expr) || sumOfWhole(expr, rawTables), /^SUM\s*\(\s*'?[^'\[\]()]+'?\s*\[[^\]]+\]\s*\)$/i.test(expr));
  }
  // The format a report writes for a field (round 14, the laptop's finish on 6 Oct: "Total Sales Last Ramadan", built with
  // variables and no format in the model, showed 10,310.00 in tables where round 13 showed 10,310). The report never adds
  // decimals the model did not ask for: where the rule proposes "#,0.00" for a field the model leaves unformatted, the
  // report writes "#,0.##" (the separator, and decimals only where the value has them), unless the measure's DAX divides
  // or averages. The health check's fix script still proposes the rule's own format, for the user to approve.
  const DIVIDES_OR_AVERAGES = /\bDIVIDE\s*\(|(^|[^/])\/(?!\/)|\bAVERAGE[AX]?\s*\(/i;
  const reportFormatOf = (obj, kind, tables) => {
    const r = formatOf(obj, kind, tables);
    if (!r || r.format !== '#,0.00' || (obj.formatString && String(obj.formatString).trim())) return r;
    const expr = Array.isArray(obj.expression) ? obj.expression.join('\n') : String(obj.expression == null ? '' : obj.expression);
    return kind === 'measure' && DIVIDES_OR_AVERAGES.test(expr.replace(/\/\/.*$/gm, '').replace(/--.*$/gm, '')) ? r : Object.assign({}, r, { format: '#,0.##', reason: 'no format in the model: the separator, and decimals only where the value has them' });
  };
  return { lacksSeparator, withSeparator, NOT_A_QUANTITY, formatOf, reportFormatOf, unquoted, DIVIDES, divides, PCT_HARD, PCT_SOFT, NOT_PCT, formatHasPercent, isNumberFormat, percentFromName, ISO4217, CURRENCY_SIGN, hasCurrency, hasUnit, isTextFormat, TEXT_EXPR, COUNTS, COUNT_EXPR };
});
