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
  return { unquoted, DIVIDES, divides, PCT_HARD, PCT_SOFT, NOT_PCT, formatHasPercent, isNumberFormat, percentFromName, ISO4217, CURRENCY_SIGN, hasCurrency, hasUnit, isTextFormat, TEXT_EXPR, COUNTS, COUNT_EXPR };
});
