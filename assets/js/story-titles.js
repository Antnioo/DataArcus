/*! DataArcus story titles | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// A visual's title that says what the visual answers, from the model's metadata only (0.3, J4; B-130, B-131): its
// measure, its category or time axis, the measure's time intelligence (PY, YTD...) and the display names the user gave.
// Never a value, a trend or a judgement: no "grew", "best", "worst"; the tools never read the data.
//   "Total Sales by Region", "Sales vs last year by Month", «إجمالي المبيعات حسب المنطقة»
// A title too long for its box is shortened by rule (the table's name before a measure, "Total", a column's "Name", a
// trailing clause), never cut in a word; the writer's own fit (pbip-sizing.js) cuts at a word only when no rule is left.
// Two charts of a page that would read the same are told apart by what they show (alternate), never "(2)".
// Browser and Node (module.exports / window.DAStoryTitles). Pure: no files.
(function (root) {
  'use strict';
  const Measure = typeof module !== 'undefined' && module.exports ? require('./text-measure.js') : root.DataArcusTextMeasure;
  const AR = /[؀-ۿ]/;
  const arabic = (x) => AR.test(String(x || ''));

  // Time intelligence written as an abbreviation in a measure's name, said in words (English, or Arabic for an Arabic
  // name). Names written in words ("Last Year", "Last Ramadan") are kept as the model has them.
  const TI = [
    { re: /^(PY|LY|SPLY)$/, en: 'last year', ar: 'في العام الماضي' },
    { re: /^YTD$/, en: 'year to date', ar: 'منذ بداية العام' },
    { re: /^QTD$/, en: 'quarter to date', ar: 'منذ بداية الربع' },
    { re: /^MTD$/, en: 'month to date', ar: 'منذ بداية الشهر' },
    { re: /^YoY$/i, en: 'vs last year', ar: 'مقارنة بالعام الماضي' },
    { re: /^MoM$/i, en: 'vs last month', ar: 'مقارنة بالشهر الماضي' },
    { re: /^vs\.?$/i, en: 'vs', ar: 'مقابل' }
  ];
  const tiOf = (w) => TI.find((t) => t.re.test(w));
  // "Sales PY" -> "Sales last year", "PY Sales" -> "Sales last year", "Sales vs PY %" -> "Sales vs last year %",
  // "Sales_YTD" -> "Sales year to date"; Arabic: "المبيعات YTD" -> «المبيعات منذ بداية العام». A name without such a
  // word is returned as it is. inArabic: the report is Arabic (0.3.0 R2): an English name is kept as the model has it,
  // never said in English words ("Sales PY" stays "Sales PY", a field name the plan lists as kept in English)
  function timeWords(name, inArabic) {
    const s = String(name == null ? '' : name), ar = arabic(s);
    if (inArabic && !ar) return s;
    const words = s.replace(/_/g, ' ').split(/\s+/).filter(Boolean).map((w) => w.replace(/^\((.*)\)$/, '$1'));
    const found = words.map(tiOf);
    if (!found.some((t) => t && t.en !== 'vs')) return s;
    const lead = [];
    let i = 0;
    while (i < words.length && found[i] && found[i].en !== 'vs') { lead.push(found[i]); i++; }   // "PY Sales": said after the name
    const out = [], rest = words.slice(i), tis = found.slice(i);
    for (let k = 0; k < rest.length; k++) {
      // (Arabic: "vs PY" is one phrase, «مقارنة بالعام الماضي», not «مقابل في العام الماضي»)
      if (ar && tis[k] && tis[k].en === 'vs' && tis[k + 1] && tis[k + 1].en === 'last year') { out.push('مقارنة بالعام الماضي'); k++; continue; }
      if (rest[k] !== '-') out.push(tis[k] ? (ar ? tis[k].ar : tis[k].en) : rest[k]);
    }
    if (!out.length) return s;
    return out.concat(lead.map((t) => (ar ? t.ar : t.en))).join(' ');
  }

  // A field's name as a title shows it: the display name the user gave, as given; else the model's name with its time
  // intelligence in words. f: { t, m | c, name? } (the writer's bound field); shown: the writer's format-character filter;
  // inArabic: the report is Arabic (timeWords).
  const nameOf = (f, shown, inArabic) => {
    const s = shown || String;
    if (!f) return null;
    if (f.name) return s(f.name);
    const n = s(f.m != null ? f.m : f.c);
    return f.m != null ? timeWords(n, inArabic) : n;
  };

  // The shortening rules, in order, each kept when it leaves a name; applied one after another until the title fits.
  const QUAL_EN = /^(after|during|within|excluding|including|for|per|by|and|used|from|in)$/i;
  const QUAL_AR = /^(بعد|خلال|من|في|حسب|لكل|المستخدمة|المستخدم|التابعة|التابع|الصادرة|الصادر|ضمن|عبر)$/;
  const clause = (x) => {   // a trailing clause: from its first qualifier word after the second word ("... after discounts")
    const w = String(x).split(' '), ar = arabic(x);
    for (let i = ar ? 2 : 1; i < w.length; i++) {
      if ((ar ? QUAL_AR : QUAL_EN).test(w[i]) || (ar && /^وال/.test(w[i]))) return w.slice(0, i).join(' ');
    }
    return x;
  };
  const RULES = [
    // the measure's table before its name ("Shipments Total Net Amount" in Shipments): the table is the page's subject
    { on: 'm', own: true, cut: (x, f) => (f && f.t && x.indexOf(f.t + ' ') === 0 && x.length > f.t.length + 1 ? x.slice(f.t.length + 1) : x) },
    // a column's "Name", "Short", "Label" ("Month Name" -> "Month"; «اسم الفرع» -> «الفرع»)
    { on: 'c', cut: (x) => (arabic(x) ? x.replace(/^اسم\s+(?=ال)/, '') : x.replace(/\s+(Name|Short|Label|Desc|Description)$/i, '')) },
    // "Total" before a measure's name ("Total Net Amount" -> "Net Amount"; «إجمالي صافي المبيعات» -> «صافي المبيعات»)
    { on: 'm', own: true, cut: (x) => (arabic(x) ? x.replace(/^(إجمالي|مجموع)\s+(?=\S)/, '') : x.replace(/^(Total|Sum of)\s+(?=\S)/i, '').replace(/^\p{Ll}/u, (ch) => ch.toUpperCase())) },   // ("Total net sales" -> "Net sales")
    // a trailing clause of the column's, then of the measure's name
    { on: 'c', cut: clause },
    { on: 'm', own: true, cut: clause }
  ];

  // One title from its parts, as the writer has always joined them (pbip-query.js byTitle, round 14): "M by C" in the
  // measure's script; a column in the other script is left out (never English words in an Arabic title, or the other
  // way round). by: the report's word ("by", «حسب»).
  // (0.3.0 R2, the owner's must-fix: an Arabic report from an English-named model said "Web Orders Total Score by Plan
  // Group") the report's word decides the title's language, not the measure's script: two English names in an Arabic
  // report are not joined with an English word; the measure's name alone, a field name the plan lists as kept in English
  function join(m, c, by) {
    if (!m || !c) return m || null;
    const ar = arabic(m);
    if (ar !== arabic(c)) return m;
    if (arabic(by) && !ar) return m;
    return m + ' ' + (ar ? (arabic(by) ? by : 'حسب') : (arabic(by) || !by ? 'by' : by)) + ' ' + c;
  }

  // Every title a visual can take, the full one first, then one per shortening rule that changes it. Each: { text, m, c }.
  // mf, cf: the bound fields (the measure, the category or time axis; cf null for a card); by: the report's word.
  function variants(mf, cf, by, shown) {
    const inAr = arabic(by);
    let m = nameOf(mf, shown, inAr), c = cf ? nameOf(cf, shown, inAr) : null;
    const out = [{ text: join(m, c, by), m, c }];
    if (!m) return out;
    RULES.forEach((r) => {
      if (r.on === 'm' && r.own && mf && mf.name) return;   // the user's own display name is never rewritten
      if (r.on === 'c' && (!c || (cf && cf.name))) return;
      const x = r.on === 'm' ? m : c, y = r.cut(x, r.on === 'm' ? mf : cf);
      if (!y || y === x || !y.trim()) return;
      if (r.on === 'm') m = y.trim(); else c = y.trim();
      const text = join(m, c, by);
      if (text !== out[out.length - 1].text) out.push({ text, m, c });
    });
    return out;
  }

  // The first title that fits (fits: the caller's measure of its box), else the shortest: the caller's fit then cuts it
  // at a word.
  const fit = (list, fits) => list.find((v) => fits(v.text)) || list[list.length - 1];

  // The same, by width alone: the title on at most `lines` lines of `avail` page units, bold, at size t (text-measure.js).
  const fitWidth = (list, avail, t, lines, font) => fit(list, (x) => Measure.textWidth(x, t, true, font) <= avail * (lines || 1));

  // The nth (2, 3, ...) chart of a page that would read like an earlier one, by the same measure and column: another
  // true sentence about what it shows. ranked: the chart is sorted by its measure (a bar or column chart's top N). Null
  // when the forms run out (the caller keeps its own rule).
  function alternate(m, c, nth, ranked, by) {
    if (!m) return null;
    const ar = arabic(m), withC = !!c && ar === arabic(c);
    if (arabic(by) && !ar) return null;   // (R2: no English sentence in an Arabic report; the caller names the column)
    const forms = ar
      ? (withC ? [ranked && `ترتيب ${c} حسب ${m}`, `${m} لكل ${c}`, `توزيع ${m} حسب ${c}`, `${m} عبر ${c}`] : [ranked && `الترتيب حسب ${m}`, `توزيع ${m}`, `نظرة على ${m}`])
      : (withC ? [ranked && `${c} ranked by ${m}`, `${m} per ${c}`, `${m} breakdown by ${c}`, `${m} across ${c}`] : [ranked && `Ranked by ${m}`, `${m} breakdown`, `${m} overview`]);
    return forms.filter(Boolean)[nth - 2] || null;
  }

  // The words a story title may never use: it states what is shown, never a judgement of the data (tests read this).
  const NEVER = { en: ['grew', 'growth of', 'best', 'worst', 'declined', 'fell', 'rose', 'up ', 'down '], ar: ['نما', 'الأفضل', 'الأسوأ', 'انخفض', 'ارتفع'] };

  const api = { timeWords, nameOf, variants, fit, fitWidth, alternate, join, RULES, TI, NEVER, arabic };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAStoryTitles = api;
})(typeof self !== 'undefined' ? self : this);
