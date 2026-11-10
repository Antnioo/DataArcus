/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The Theme Generator's downloads (0.3.2 SP31, the split of theme-generator.js: the Codex split map, B-280): the download
// coordinator. The theme JSON (download and copy), the slot table (copy and CSV), the background PNG (with its credit
// metadata), the Power BI project (your own model or the sample, the logo, the Arabic names to approve before an Arabic
// download on English names, the check before download, the preview of its pages), the visual backgrounds choice and
// the reminder when a downloaded file is out of date. It alone holds what was downloaded (each file's fingerprint), the
// names the person approved and whether the backgrounds were switched for them; nothing is built before the person
// approves the names on this page, and the preview and check read structure only, never data.
//
// Interface (one input, one output):
//   In:  mount({ store, engine, $, L, isAr, track, toast, layout, loaders, hooks })
//        store    the design's store (theme-state-ui.js): get() read on every call, save() after a change
//        engine   the design engine (DAEngine)
//        $, L, isAr, track, toast  the page's element lookup, language function L(en, ar), whether it is Arabic,
//                 analytics call and toast
//        layout   the layout step's api (theme-layout-ui.js): lay, page, applyPage, computeSlots, boxOf, rtl, nm,
//                 pngSize, seg, renderLayoutPreview
//        loaders  the scripts loaded on demand, each with its ?v= stamp in theme-generator.js (one place):
//                 builder() (the report writer, DAPbip), bind() (the model reader and picker, DABind), names() (the
//                 Arabic names and the fixed words), check() (DALayoutCheck), preview() (DAPagePreview), worker (the
//                 model reader's worker URL)
//        hooks    buildTheme() (the theme JSON), renderJson(), bgSvg(slots, opt) (the background, with the sample
//                 visuals in the preview)
//   Out: { updateStatus, renderVis, layoutChanged, canvasFit }
//        updateStatus()   the reminder and the files' stale marks, from the fingerprints (and the picker in step)
//        renderVis()      the visual backgrounds choice
//        layoutChanged()  the first layout change switches the backgrounds to transparent (unless picked)
//        canvasFit()      page 1 as the project download writes it ({ layout, slots }), or null
(function (root) {
  'use strict';

  function mount({ store, engine, $, L, isAr, track, toast, layout, loaders, hooks }) {
    const E = engine, design = () => store.get();
    const { KINDS, LAYOUTS } = E;
    const { lay, page, applyPage, computeSlots, boxOf, rtl, nm, pngSize, seg, renderLayoutPreview } = layout;
    // what more than one step reads or writes: each file's fingerprint, whether the backgrounds were switched for the
    // person, the picker's and the canvas's hooks, the logo
    const st = { lastJson: null, lastPng: null, lastCsv: null, autoSwitched: false, pbipSync: null, canvasFit: null, logo: null };
    const d = { store, E, $, L, isAr, track, toast, loaders, hooks, design, KINDS, LAYOUTS, lay, page, applyPage, computeSlots, boxOf, rtl, nm, pngSize, seg, renderLayoutPreview, st };
    [statusKit, fileKit, jsonPart, slotPart, pngPart].forEach((step) => step(d));

    // ---------- Power BI project (.pbip): theme, background and every visual in one download ----------
    // Only on pages that have the project card (the lab page for now). The builder loads on first use.
    d.pbipBtn = $('pbipBtn');
    if (d.pbipBtn) [modelPart, modelFilesPart, logoPart, namesPart, projectPart, canvasPart, checkPart, pbipDownloadPart, previewPart].forEach((step) => step(d));
    statusListeners(d);

    return { updateStatus: d.updateStatus, renderVis: d.renderVis, layoutChanged: d.layoutChanged, canvasFit: () => st.canvasFit && st.canvasFit() };
  }

  // step 3's status (the function declarations mount hoisted): each file's fingerprint, the visual backgrounds, the reminder
  function statusKit(d) {
    const { E, $, L, toast, hooks, design, lay, page, computeSlots, boxOf, seg, st } = d;
    // ---------- step 3: visual backgrounds, and a reminder when a downloaded file is out of date ----------
    // each file keeps a fingerprint of what was downloaded; a different fingerprint now means it is out of date
    function pngKey() { return E.isGlass(design()) ? 'glass' + JSON.stringify([design().ui, design().data, page()]) : hooks.bgSvg(computeSlots(lay()), {}); }
    function csvKey() { return JSON.stringify(computeSlots(lay()).map((s) => [s.kind, boxOf(s)])); }
    // Visual backgrounds follow what the visitor uses (owner 2026-10-04): Solid for a colour-only visitor, Transparent
    // from the first change in the Layout step (they are making a background), unless they picked one themselves
    function layoutChanged() {
      const c = lay(); if (c.transparent || c.visPicked) return;
      c.transparent = true; st.autoSwitched = true; renderVis(); hooks.renderJson();
      toast(L('Visual backgrounds set to Transparent, to sit on the background image', 'أصبحت خلفيات العناصر شفافة، لتجلس على صورة الخلفية'));
    }
    function renderVis() {
      // (GL1) with the glass look the cards are see-through visuals over the soft picture: no choice to make here
      if (E.isGlass(design())) { $('dlVis').innerHTML = `<span class="tg-label">${L('Visual backgrounds in the theme', 'خلفيات العناصر في السمة')}</span><small class="d-block mt-1 text-white-50">${L('Glass (step 1, Card look): see-through cards. The background download is the soft picture they sit on; set it in Format page › Canvas background, Image fit Fit (Stretch in older versions), transparency 0%.', 'زجاجي (الخطوة 1، شكل البطاقات): بطاقات شفافة. تنزيل الخلفية هو الصورة الناعمة التي تجلس عليها؛ ضعها من Format page › Canvas background مع Image fit: Fit وشفافية 0%.')}</small>`; return; }
      const t = !!lay().transparent;
      $('dlVis').innerHTML = `<span class="tg-label">${L('Visual backgrounds in the theme', 'خلفيات العناصر في السمة')}</span>${seg('transparent', [[1, L('Transparent (use with the background)', 'شفافة (مع الخلفية)')], [0, L('Solid (theme only)', 'مصمتة (السمة فقط)')]], t ? 1 : 0)}
      ${t && st.autoSwitched ? `<small class="d-block mt-1 tg-warn" data-auto>${L('Switched to Transparent because you changed the layout. Choose Solid if you only use the theme.', 'تحوّلت إلى شفافة لأنك غيّرت التخطيط. اختر مصمتة إن كنت تستخدم السمة فقط.')}</small>` : ''}
      <small class="d-block mt-1 text-white-50">${t ? L('Visuals have no fill, so each one sits on its panel in the background image.', 'العناصر بلا تعبئة، فيجلس كل عنصر على لوحته في صورة الخلفية.') : L('Each visual gets its own card color. Choose this if you only use the theme, without the background image.', 'يأخذ كل عنصر لون بطاقة خاصًا به. اختره إذا كنت تستخدم السمة فقط دون صورة الخلفية.')}</small>`;
    }
    function updateStatus() {
      if (!$('dlStatus')) return;
      const files = [
        ['json', L('Theme', 'السمة'), st.lastJson !== null && st.lastJson !== JSON.stringify(hooks.buildTheme(), null, 2)],
        ['png', L('Background', 'الخلفية'), st.lastPng !== null && st.lastPng !== pngKey()],
        ['csv', L('Layout table', 'جدول التخطيط'), st.lastCsv !== null && st.lastCsv !== csvKey()]];
      const old = files.filter((f) => f[2]), solid = st.lastPng !== null && !lay().transparent && !E.isGlass(design());   // (GL1: glass cards are meant to be seen through)
      const note = (text, act, btn) => `<div class="tg-note"><i class="bi bi-exclamation-circle" aria-hidden="true"></i><span>${text}</span><button type="button" data-dl="${act}">${btn}</button></div>`;
      let h = '';
      if (old.length) h += note(L(`Changed since you downloaded: <b>${old.map((f) => f[1]).join(', ')}</b>.`, `تغيّر منذ التنزيل: <b>${old.map((f) => f[1]).join('، ')}</b>.`), 'stale', old.length > 1 ? L('Download these again', 'نزّلها من جديد') : L('Download again', 'نزّل من جديد'));
      if (solid) h += note(L('Your theme has solid visual backgrounds, so visuals will cover the panels in the background image.', 'سمتك بخلفيات عناصر مصمتة، فستغطي العناصر اللوحات في صورة الخلفية.'), 'transparent', L('Switch to transparent', 'حوّلها إلى شفافة'));
      $('dlStatus').innerHTML = h;
      files.forEach((f) => { const card = document.querySelector(`.tg-file[data-file="${f[0]}"]`); if (card) card.classList.toggle('stale', f[2]); });
      const s3 = document.querySelector('.tg-steps [data-step="download"]'); if (s3) s3.classList.toggle('stale', old.length > 0 || solid);
      if (st.pbipSync) st.pbipSync();
    }
    Object.assign(d, { pngKey, csvKey, layoutChanged, renderVis, updateStatus });
  }

  function fileKit(d) {
    const { E, design } = d;
    // every download is named after the theme: letters of any script are kept (Arabic, café), other symbols dropped
    const fileBase = () => E.fileBase(design().name);
    const saveBlob = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
    Object.assign(d, { fileBase, saveBlob });
  }

  // the theme JSON: copy and download
  function jsonPart(d) {
    const { $, L, track, toast, hooks, design, st, updateStatus, fileBase } = d;
    const copyText = (text, node, o) => window.DAPageToast.copyText(text, node, o);   // page-toast.js, its one home (0.3.2 DD2W)
    $('copyBtn').addEventListener('click', () => {
      const text = JSON.stringify(hooks.buildTheme(), null, 2);
      copyText(text, $('json'), { done: L('Theme JSON copied', 'تم نسخ ملف السمة'), selected: L('Selected. Press Ctrl+C to copy', 'تم التحديد. اضغط Ctrl+C للنسخ'), toast });
      st.lastJson = text; updateStatus();
      track('theme_copy', { preset: design().preset || 'custom' });
    });
    const downloadJson = (from) => {
      const text = JSON.stringify(hooks.buildTheme(), null, 2), blob = new Blob([text], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileBase() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      st.lastJson = text; updateStatus();
      toast(L('Downloaded. Import it via View → Themes', 'تم التنزيل. استورده من View → Themes'));
      track('theme_download', { preset: design().preset || 'custom', font: design().font, from });
    };
    $('dlBtn').addEventListener('click', () => downloadJson('step3'));
    Object.assign(d, { downloadJson });
  }

  // the slot table: copy and CSV
  function slotPart(d) {
    const { $, L, isAr, track, toast, KINDS, lay, computeSlots, boxOf, nm, st, csvKey, updateStatus, fileBase, saveBlob } = d;
    const slotRows = () => computeSlots(lay()).map((s) => { const b = boxOf(s); return [nm(s.role), nm(KINDS[s.kind]), b.x, b.y, b.w, b.h]; });
    const slotHead = () => (isAr() ? ['العنصر', 'النوع المقترح', 'أفقي X', 'رأسي Y', 'العرض', 'الارتفاع'] : ['Slot', 'Suggested visual', 'X (horizontal)', 'Y (vertical)', 'Width', 'Height']);
    $('slotCopy').addEventListener('click', () => {
      const text = [slotHead()].concat(slotRows()).map((r) => r.join('\t')).join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('Table copied. Paste it into Excel or Notes', 'تم نسخ الجدول. الصقه في Excel أو الملاحظات')), () => toast(L('Copy failed. Use Download .csv', 'تعذّر النسخ. استخدم تنزيل .csv')));
      st.lastCsv = csvKey(); updateStatus();
      track('theme_layout_slots', { method: 'copy', layout: lay().preset });
    });
    const downloadCsv = () => {
      const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
      const credit = [[], [L('Made with the DataArcus Power BI Theme & Layout Generator: dataarcus.com/tools/power-bi-theme-generator.html', 'صُنع بمولّد السمات والتخطيطات لـ Power BI من DataArcus: dataarcus.com/tools/power-bi-theme-generator.html')]];   // a credit line after the table
      const csv = '﻿' + [slotHead()].concat(slotRows(), credit).map((r) => r.map(q).join(',')).join('\r\n');
      saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${fileBase()}-layout-${lay().preset}.csv`);
      st.lastCsv = csvKey(); updateStatus();
      toast(L('Table downloaded. Open it next to Power BI', 'تم تنزيل الجدول. افتحه بجانب Power BI'));
      track('theme_layout_slots', { method: 'csv', layout: lay().preset });
    };
    $('slotCsv').addEventListener('click', downloadCsv);
    Object.assign(d, { downloadCsv });
  }

  // the background PNG, with its credit metadata
  function pngPart(d) {
    const { E, $, L, track, toast, hooks, design, lay, page, applyPage, computeSlots, rtl, pngSize, st, pngKey, updateStatus, fileBase, saveBlob } = d;
    // PNG text metadata (tEXt chunks after the header) credit DataArcus without touching a single pixel
    // (0.3.2 DD2P) the chunk and its CRC-32: png-bytes.js pngChunk (DAPngBytes, loaded before this file), their one place
    const PngBytes = root.DAPngBytes;
    const textChunk = (key, value) => PngBytes.pngChunk('tEXt', new TextEncoder().encode(`${key}\0${value}`.replace(/[^\x00-\xff]/g, '')));
    const withCredits = (blob) => blob.arrayBuffer().then((buf) => {
      const png = new Uint8Array(buf), head = 33;   // 8-byte signature + 25-byte IHDR chunk
      const chunks = [textChunk('Software', 'DataArcus Power BI Theme & Layout Generator'), textChunk('Source', 'https://dataarcus.com/tools/power-bi-theme-generator.html')];
      return new Blob([png.subarray(0, head), ...chunks, png.subarray(head)], { type: 'image/png' });
    }).catch(() => blob);
    // the background as a PNG blob (with the credit metadata); used by the PNG download and the Power BI project
    // (round 24, B1: fit, when given, turns the planned slots into those the report writer lays out, so the panels the
    // picture draws are the visuals' own: a left-out line chart's room given to the chart beside it, one panel under it)
    // (GL1) with the glass look the background is the engine's soft picture at the page's size (glassPng), the same bytes
    // as the MCP's create_report writes; no panels (the cards are see-through visuals)
    const pngBlob = (c, fit) => (E.isGlass(design()) ? Promise.resolve(((p) => new Blob([E.glassPng(Object.assign({}, design(), { layout: c || lay() }), p.w, p.h)], { type: 'image/png' }))(page(c || lay()))) : new Promise((resolve, reject) => {
      const was = design().layout; if (c) design().layout = c;
      const sl = computeSlots(lay()), [pw, ph] = pngSize(), svg = hooks.bgSvg(fit ? fit(sl) : sl, { w: pngSize()[0], h: pngSize()[1] });
      design().layout = was; if (c) applyPage(was);
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
        cv.getContext('2d').drawImage(img, 0, 0, pw, ph);
        cv.toBlob((b) => (b ? withCredits(b).then(resolve) : reject(new Error('png'))), 'image/png');
      };
      img.onerror = () => reject(new Error('png'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }));
    const downloadPng = () => {
      const key = pngKey();
      pngBlob().then((png) => {
        st.lastPng = key; updateStatus();
        saveBlob(png, `${fileBase()}-background-${lay().preset}.png`);
        toast(L('Background downloaded. Set it in Format page › Canvas background', 'تم تنزيل الخلفية. ضعها من Format page › Canvas background'));
      }, () => toast(L('Could not create the image in this browser', 'تعذّر إنشاء الصورة في هذا المتصفح')));
      track('theme_layout_png', { layout: lay().preset, direction: rtl() ? 'rtl' : 'ltr', kpis: lay().kpis });
    };
    $('pngBtn').addEventListener('click', downloadPng);
    Object.assign(d, { pngBlob, downloadPng });
  }

  function modelPart(d) {
    const { $, L, isAr, track, lay, loaders, st } = d;
    // ---- your own model: a local project (the report points at its .SemanticModel folder) or a published one ----
    // Each choice keeps its own model and the fields picked for it, so switching between them never pairs one
    // model's fields with the other's location: own.local / own.service = { tables, msg, bad, folder, dir, reports, choices }
    const dataIn = $('pbipData'), own = { local: null, service: null, getBind: null };
    const ownMsg = (text, bad) => { const m = $('pbipOwnMsg'); if (m) { m.textContent = text; m.style.color = bad ? '#fca5a5' : ''; } };
    const mode = () => (dataIn ? dataIn.value : 'sample');
    // KPI cards on the pages this download makes: the main layout and the second page (3 or 4)
    const kpiSlots = () => Math.max(lay().kpis || 0, $('pbipPages') && $('pbipPages').checked ? 4 : 0, 1);
    // the picker for the model of the current choice, one KPI row per card; the visitor's picks are kept
    const showPicker = (DB) => {
      if (own.getBind) own.getBind();   // remember the picks shown so far
      own.getBind = null; const map = $('pbipMap'); if (map) map.innerHTML = '';
      const e = own[mode()];
      if (!e || !map) { ownMsg(''); return; }
      ownMsg(e.msg, e.bad);
      if (!e.tables.length) return;
      const n = kpiSlots(), fresh = DB.suggest(e.tables, n, Object.assign({ lang: isAr() ? 'ar' : 'en' }, (e.relationships || []).length ? { relationships: e.relationships, modelTables: e.tables } : {}));   // (round 23: the fields in the report's language; the model's relationships where it gives them, as the MCP does)
      let bind = fresh;
      if (e.choices) {
        const id = (k) => (k ? k.t + '\u0000' + k.m : ''), kpis = e.choices.kpis.slice(0, n);
        fresh.choices.kpis.forEach((k) => { if (k && kpis.length < n && !kpis.some((x) => id(x) === id(k))) kpis.push(k); });
        while (kpis.length < n) kpis.push(null);
        bind = DB.build(Object.assign({}, e.choices, { kpis }));
      }
      e.kpiN = n;
      const get = DB.renderPicker(map, e.tables, bind, L);
      own.getBind = () => { const b = get(); e.choices = b.choices; return b; };
    };
    // the number of KPI cards changed (layout, second page): the picker follows
    st.pbipSync = () => { const e = own[mode()]; if (e && window.DABind && e.kpiN !== kpiSlots()) showPicker(window.DABind); };
    const showOwn = () => {
      const m = mode(), box = $('pbipOwn'); if (!box) return;
      box.hidden = m !== 'local' && m !== 'service';
      box.querySelectorAll('[data-own]').forEach((d) => { d.hidden = d.dataset.own !== m; });
      if (!box.hidden) loaders.bind().then(showPicker).catch(() => {});
    };
    const loaded = (m, res, where0) => loaders.bind().then((DB) => {
      const where = DB.iso(where0);
      const ms = res.tables.reduce((a, t) => a + t.measures.filter((x) => !x.isHidden).length, 0);
      own[m] = Object.assign({}, res, !res.tables.length ? { msg: L('No tables found in this model.', 'لم يتم العثور على جداول في هذا النموذج.'), bad: true }
        : { msg: L(`${where}: ${res.tables.length} tables, ${ms} measures. Each visual below has a suggested field; change any of them.`,
          `${where}: ${res.tables.length} جدول، ${ms} مقياس. لكل عنصر أدناه حقل مقترح، ويمكنك تغيير أي منها.`)
          + (!ms ? L(' This model has no measures, so KPI cards and charts stay empty until you add some.', ' لا توجد مقاييس في هذا النموذج، لذا تبقى البطاقات والمخططات فارغة حتى تضيفها.') : '') });
      if (mode() === m) { own.getBind = null; showPicker(DB); }   // a new model starts from the suggestions
      if (res.tables.length) track('theme_pbip_model', { mode: m, tables: res.tables.length, measures: ms });
    });
    const failed = (m, e) => {
      const code = e && e.message;
      // (0.3.2 DD1G) two models at the same level: both named and the visitor asks, as the MCP does (never a silent pick)
      const many = code === 'MANY_MODELS' && e.models ? e.models.join('; ') : null;
      own[m] = { tables: [], bad: true, msg: many ? L(`This folder holds ${e.models.length} models at the same level: ${many}. Choose the model's own folder.`, `يحتوي هذا المجلد على ${e.models.length === 2 ? 'نموذجين' : e.models.length + ' نماذج'} في المستوى نفسه: ${many}. اختر مجلد النموذج نفسه.`)
        : code === 'NO_SEMANTIC_MODEL' ? L('No .SemanticModel folder here. Choose the folder you saved the Power BI project in.', 'لا يوجد مجلد .SemanticModel هنا. اختر المجلد الذي حفظت فيه مشروع Power BI.')
        : code === 'PBIX' ? L('A .pbix keeps its model in a format only Power BI reads. Use File › Export › Power BI template (.pbit).', 'ملف .pbix يحفظ النموذج بصيغة لا يقرؤها إلا Power BI. استخدم File › Export › Power BI template (.pbit).')
          : code === 'ZIP_LIMIT' || code === 'TOO_BIG' ? L('This file is larger than a Power BI template without data (usually under 20 MB), or unpacks to more than it says, so it was not read. Export a fresh .pbit from Power BI Desktop.', 'هذا الملف أكبر من قالب Power BI بدون بيانات (عادة أقل من 20 ميجابايت)، أو يتجاوز عند فك ضغطه ما يذكره، لذا لم يُقرأ. صدّر ملف ‎.pbit‎ جديدًا من Power BI Desktop.')
          : code === 'TMDL_ONLY' ? L('This file has the model as TMDL. Choose the project folder instead, on the other option.', 'هذا الملف يحفظ النموذج بصيغة TMDL. اختر مجلد المشروع بدلًا منه.')
            : L('Could not read the model in this file.', 'تعذّرت قراءة النموذج في هذا الملف.') };
      if (mode() === m) { own.getBind = null; loaders.bind().then(showPicker).catch(() => ownMsg(own[m].msg, true)); }
    };
    Object.assign(d, { dataIn, own, ownMsg, mode, showOwn, loaded, failed });
  }

  // the model choice and its two pickers (a project folder, a .pbit file)
  function modelFilesPart(d) {
    const { $, L, loaders, st, dataIn, ownMsg, showOwn, loaded, failed } = d;
    if (dataIn) {
      dataIn.addEventListener('change', showOwn); showOwn();
      if ($('pbipPages')) $('pbipPages').addEventListener('change', () => st.pbipSync());
      $('pbipFolder').addEventListener('change', (e) => {
        const files = e.target.files; if (!files || !files.length) return;
        ownMsg(L('Reading the model…', 'جارٍ قراءة النموذج…'));
        // with more than one model in the folder, say which one (by its path) the report will use
        loaders.bind().then((DB) => DB.fromFolder(files)).then((res) => loaded('local', Object.assign(res, { dir: res.path.replace(/\/?[^/]*$/, '') }),
          res.others ? res.path + L(` (${res.others + 1} models in this folder; this one is used)`, ` (عدد النماذج في المجلد: ${res.others + 1}، ويُستخدم هذا النموذج)`) : res.folder))
          .catch((err) => failed('local', err));
      });
      $('pbipModelFile').addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        ownMsg(L('Reading the model…', 'جارٍ قراءة النموذج…'));
        loaders.bind().then((DB) => DB.fromFile(f, loaders.worker)).then((res) => loaded('service', res, f.name)).catch((err) => failed('service', err));
      });
    }
  }

  // the logo
  function logoPart(d) {
    const { E, $, L, toast, st } = d;
    const logoIn = $('pbipLogo');
    if (logoIn) logoIn.addEventListener('change', () => {
      const f = logoIn.files && logoIn.files[0]; st.logo = null;
      const out = $('pbipLogoName');
      if (!f) { if (out) out.textContent = ''; return; }
      const ext = /png$/i.test(f.type) ? 'png' : /jpe?g$/i.test(f.type) ? 'jpg' : null;
      if (!ext || f.size > 2 * 1024 * 1024) { logoIn.value = ''; if (out) out.textContent = ''; toast(L('Use a PNG or JPG logo under 2 MB', 'استخدم شعارًا بصيغة PNG أو JPG أقل من 2 ميجابايت')); return; }
      // the logo's own size, so its box in the header takes its shape; a tall logo gets a hint (it will be thin there)
      f.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf), size = E.imageSize(bytes);
        st.logo = { bytes, ext, ratio: size ? size.w / size.h : undefined };
        if (out) out.textContent = f.name + (size && size.h > size.w ? '. ' + L('This logo is tall; a horizontal version will read much better in the header.', 'هذا الشعار طولي؛ نسخة أفقية منه ستكون أوضح بكثير في الشريط العلوي.') : '');
      });
    });
  }

  function namesPart(d) {
    const { $, L, isAr, toast, loaders, pbipBtn } = d;
    // ---- (0.3.1 TT2; the owner, 27 Oct, D-1027-19 "Both A") an Arabic download on English names: the names first ----
    // Every field the report's visuals show with no Arabic name is listed (#pbipNames): its English name, an Arabic draft
    // from DataArcus's fixed words (assets/data/arabic-report-words.json, this site's own file: nothing about the model is
    // sent) or an empty box, and "Keep English" (never ticked by default). Nothing is built until the person approves
    // every one; the approved names are the display names the titles use (each title wholly Arabic, or wholly English for
    // a name kept English), and the README says them. The English download, the sample and a model named in Arabic: no step.
    const namesBox = $('pbipNames');
    let namesAnswers = {};   // the person's last approved answers, by field ("Table[Field]"), on this page only
    const namesFor = (P, DB, input, m) => {
      if (!namesBox || !isAr() || !(m === 'local' || m === 'service') || !input.bind) return Promise.resolve({ input });
      return loaders.names().then(([N, list]) => {
        // the fields the report would show, from a build of this very input (its pictures aside)
        const items = N.toApprove(P.build(Object.assign({}, input, { pages: input.pages.map((p) => Object.assign({}, p, { png: null })) })), input.bind, list);
        const a = N.approve(items, namesAnswers);
        if (!items.length) return { input };
        if (!a.ok) return { input, pending: { N, items } };
        return { input: Object.assign({}, input, { bind: N.withNames(input.bind, a.names, DB.mapFields), namesNote: N.note(a) }) };
      });
    };
    const askNames = ({ N, items }) => {
      const el = (tag, cls, text) => window.DAPageToast.el(document, tag, cls, text);   // (0.3.3 SG1) page-toast.js, its one place
      const iso = (s) => '⁨' + s + '⁩';
      namesBox.textContent = '';
      const h = el('h3', 'h6 fw-bold mb-1', L('Arabic names for your fields', 'أسماء عربية لحقول نموذجك')); h.id = 'pbipNamesH';
      // the drafts are suggestions to check: said in Arabic and in English
      const ar = el('p', 'small mb-1', 'هذه المسودات اقتراحات من قائمة كلمات DataArcus الثابتة، وليست ترجمة: راجع كل اسم وعدّله قبل الموافقة. المربع الفارغ لا اقتراح له، فاكتب الاسم بنفسك، أو أبقِه بالإنجليزية. لا يُرسَل شيء من نموذجك.'); ar.lang = 'ar'; ar.dir = 'rtl';
      const en = el('p', 'small text-white-50 mb-2', 'These drafts are suggestions from DataArcus\'s fixed word list, not a translation: check and edit each name before you approve. An empty box has no suggestion: type the name, or keep it in English. Nothing from your model is sent.'); en.lang = 'en'; en.dir = 'ltr';
      namesBox.append(h, ar, en);
      items.forEach((x, i) => {
        const row = el('div', 'tg-names-row'), was = namesAnswers[x.key] || {}; row.setAttribute('data-name-key', x.key);
        const name = el('label', 'tg-names-en', x.english); name.setAttribute('data-name-en', ''); name.lang = 'en'; name.dir = 'ltr'; name.htmlFor = 'pbipName' + i;
        const box = el('input', 'form-control form-control-sm'); box.type = 'text'; box.id = 'pbipName' + i; box.maxLength = 80; box.lang = 'ar'; box.dir = 'rtl'; box.autocomplete = 'off';
        box.value = was.ar != null ? was.ar : x.draft;
        const keep = el('label', 'tg-check tg-names-keep'), cb = el('input'); cb.type = 'checkbox'; cb.checked = was.keep === true;
        cb.setAttribute('aria-label', L('Keep in English: ', 'إبقاؤه بالإنجليزية: ') + iso(x.english));
        keep.append(cb, ' ', el('span', null, L('Keep English', 'إبقاؤه بالإنجليزية')));
        box.disabled = cb.checked; cb.addEventListener('change', () => { box.disabled = cb.checked; });
        row.append(name, box, keep); namesBox.appendChild(row);
      });
      const msg = el('p', 'small tg-warn mb-2'); msg.id = 'pbipNamesMsg'; msg.setAttribute('role', 'alert');
      const ok = el('button', 'btn btn-accent w-100'); ok.type = 'button'; ok.id = 'pbipNamesOk';
      ok.append(el('i', 'bi bi-check2 me-1'), el('span', null, L('Approve these names and download', 'اعتمد هذه الأسماء ونزّل التقرير'))); ok.firstChild.setAttribute('aria-hidden', 'true');
      ok.addEventListener('click', () => {
        const answers = {};
        namesBox.querySelectorAll('[data-name-key]').forEach((r) => { answers[r.getAttribute('data-name-key')] = { ar: r.querySelector('input[type=text]').value, keep: r.querySelector('input[type=checkbox]').checked }; });
        const a = N.approve(items, answers);
        if (!a.ok) {
          const why = { hidden: L('has an invisible sign', 'فيه علامة غير مرئية'), notArabic: L('has no Arabic letter (tick "Keep English" to keep it in English)', 'ليس فيه حرف عربي (اختر «إبقاؤه بالإنجليزية» لتبقيه بالإنجليزية)'), long: L('is longer than 80 characters', 'أطول من 80 حرفًا') };
          msg.textContent = (a.missing.length ? L('Type an Arabic name, or tick "Keep English", for: ', 'اكتب اسمًا عربيًا، أو اختر «إبقاؤه بالإنجليزية»، لـ: ') + a.missing.map(iso).join(L(', ', '، ')) + '. ' : '')
            + a.bad.map((b) => iso(b.english) + ' ' + why[b.why] + '.').join(' ');
          const first = items.find((x) => a.missing.includes(x.english) || a.bad.some((b) => b.key === x.key));
          const row = first && [...namesBox.querySelectorAll('[data-name-key]')].find((r) => r.getAttribute('data-name-key') === first.key);
          if (row) row.querySelector('input[type=text]').focus();
          return;
        }
        namesAnswers = answers; namesBox.hidden = true; namesBox.textContent = '';
        pbipBtn.click();
      });
      namesBox.append(msg, ok); namesBox.hidden = false;
      toast(L('Approve the Arabic names first', 'وافق على الأسماء العربية أولًا'));
      const first = namesBox.querySelector('input[type=text]'); if (first) first.focus();
    };
    Object.assign(d, { namesFor, askNames });
  }

  function projectPart(d) {
    const { E, $, L, isAr, toast, hooks, design, LAYOUTS, lay, nm, rtl, loaders, st, own, mode, namesFor } = d;
    // the download's input, for the download and for its preview (0.3.0 step 1: the preview draws what the download
    // contains): null when something is missing (said in a toast), else a promise of then(P, input, what)
    // (0.3.1 LC1) the same input for the layout canvas (quiet: nothing said, undefined when something is missing)
    const projectOf = (quiet) => {
      const c = lay(), m = mode(), sample = m === 'sample';
      // your own model: where it is, and the fields picked for each visual
      let model = null;
      if (m === 'local') {
        if (!own.local || !own.local.folder) { if (!quiet) toast(L('Choose your Power BI project folder first', 'اختر مجلد مشروع Power BI أولًا')); return; }
        model = { byPath: own.local.folder, taken: own.local.reports };
      } else if (m === 'service') {
        const ws = $('pbipWs').value.trim(), mn = $('pbipModelName').value.trim();
        if (!ws || !mn) { if (!quiet) toast(L('Type the workspace and the semantic model names', 'اكتب اسم مساحة العمل واسم النموذج الدلالي')); return; }
        model = { ws, mn };   // the connection string is written once the helper has loaded, below
      }
      // the picker always shows the model of the current choice (see showPicker)
      const bind = model && own[m] && own.getBind ? own.getBind() : null;
      // visuals sit on the panels of the background image, so the project's theme always has transparent visuals
      const was = c.transparent; c.transparent = true; const theme = hooks.buildTheme(); c.transparent = was;
      // the pages (design engine): this layout, a second page in a complementary layout when asked, and filters as a
      // slide-in panel when asked; each page's background is drawn for its own layout
      // Round 24 (the laptop's re-proof of round 23; the owner's "Fix them now"), on the user's own model:
      // B2: a KPI card the model has no measure for is not written: the pages get at most the model's KPI count (the
      // engine's maxKpis, 0.2.9 A2-4; the cards left share the row, and the background's panels follow them) instead of a cardVisual with no field ("Select or add
      // data" in Desktop); B1: with no time axis the writer gives the line chart's room to the chart beside it
      // (the design engine's fitSlots since 0.2.9 A2-3), so the background is drawn from those same slots, one panel under the widened chart
      const nK = model && bind ? (bind.kpis || []).filter(Boolean).length : null;
      // (R24-1, the review of round 24: the writer gives card i the binding's KPI i, so a KPI emptied in the middle of the
      // picker left an empty card and dropped the last one: the picked KPIs fill the cards in their order)
      const bindL = bind && nK < (bind.kpis || []).length ? Object.assign({}, bind, { kpis: bind.kpis.filter(Boolean) }) : bind;
      const specs = E.projectPages(c, isAr() ? 'ar' : 'en', { second: !!($('pbipPages') && $('pbipPages').checked), panel: !!($('pbipPanel') && $('pbipPanel').checked), logoRatio: st.logo ? st.logo.ratio : undefined, maxKpis: nK != null ? nK : undefined, noTime: !!(model && bind && !bind.date) });   // (D16: a model with no time axis gets the layout made for it, as the MCP's)
      return { c, m, sample, model, bind, bindL, theme, specs };
    };
    // the project's pages and the writer's input, from projectOf's q and the model as the writer takes it
    const inputOf = (q, model) => {
      const { c, m, sample, bindL, theme, specs } = q;
      // kpiInset: where the KPI titles start beside the side accent bar drawn in this page's background
      const pages = specs.map((sp) => ({ name: sp.name, page: sp.page, slots: sp.slots, png: null, panel: sp.panel, kpiInset: E.kpiInset(sp.layout) }));
      const input = {
        name: design().name || 'Power BI Report', title: design().name || L('Sales overview', 'نظرة عامة على المبيعات'), pageName: nm(LAYOUTS[c.preset].name),
        lang: isAr() ? 'ar' : 'en', rtl: rtl(), font: design().font, ui: design().ui, pages, theme, logo: st.logo, sample, model, bind: bindL,
        // round 15 (the owner's go on round 13's recommendation 2b): a right-to-left download has its charts mirrored, as the MCP's
        ...(rtl() ? { chartAxes: 'mirrored' } : {}),
        // the report's labels come from the design engine (the MCP uses the same); the readme stays here
        texts: Object.assign({}, E.REPORT_TEXTS[isAr() ? 'ar' : 'en'], {
          readme: m === 'service' ? L('# {name}\n\nMade with the DataArcus Power BI Theme & Layout Generator: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## Open it\n1. Unzip this folder.\n2. Open **{name}.pbip** in Power BI Desktop and sign in. The report connects live to your published semantic model.\n3. Check each visual, then publish the report to the same workspace.\n\n## Check it in Power BI (2 minutes)\n1. On every page, each visual sits on its panel in the background and shows data.\n2. If the colours look off: **View > Themes > Browse for themes** and pick the theme file in **{name}.Report/StaticResources/RegisteredResources**.\n3. Hover any chart: the tooltip page shows.\n4. Ctrl+click the page buttons and **Reset filters** (and the **Filters** button if you chose the slide-in panel).\n5. **View > Mobile layout**: the phone version is already laid out.\n\nSomething looks wrong? Send a screenshot to hello@dataarcus.com.\n',
            '# {name}\n\nصُنع بمولّد السمات والتخطيطات لـ Power BI من DataArcus: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## افتحه\n1. فك ضغط هذا المجلد.\n2. افتح **{name}.pbip** في Power BI Desktop وسجّل الدخول. يتصل التقرير مباشرة بنموذجك الدلالي المنشور.\n3. راجع كل عنصر، ثم انشر التقرير في نفس مساحة العمل.\n\n## راجعه في Power BI (دقيقتان)\n1. في كل صفحة، كل عنصر في مكانه على لوحته في الخلفية ويعرض بيانات.\n2. إذا بدت الألوان غير صحيحة: **View > Themes > Browse for themes** واختر ملف السمة في **{name}.Report/StaticResources/RegisteredResources**.\n3. مرّر الماوس على أي مخطط: تظهر صفحة التلميح.\n4. اضغط Ctrl مع النقر على أزرار الصفحات و **Reset filters** (وزر **Filters** إذا اخترت اللوحة المنزلقة).\n5. **View > Mobile layout**: نسخة الهاتف جاهزة.\n\nهل يبدو شيء غير صحيح؟ أرسل لقطة شاشة إلى hello@dataarcus.com.\n') : L('# {name}\n\nMade with the DataArcus Power BI Theme & Layout Generator: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## Open it\n1. Unzip this folder.\n2. Open **{name}.pbip** in Power BI Desktop.\n3. If you chose sample data, click **Refresh** once so it loads.\n\n## Use your own data\nGet data, then drag your fields into each visual. The theme, background, positions, tooltip page and filter pane styling are already set.\n\nOlder Power BI Desktop versions: turn on **File > Options > Preview features > Power BI Project (.pbip) save option** and **Store reports using enhanced metadata format (PBIR)**.\n\n## Check it in Power BI (2 minutes)\n1. On every page, each visual sits on its panel in the background and shows data.\n2. If the colours look off: **View > Themes > Browse for themes** and pick the theme file in **{name}.Report/StaticResources/RegisteredResources**.\n3. Hover any chart: the tooltip page shows.\n4. Ctrl+click the page buttons and **Reset filters** (and the **Filters** button if you chose the slide-in panel).\n5. **View > Mobile layout**: the phone version is already laid out.\n\nSomething looks wrong? Send a screenshot to hello@dataarcus.com.\n',
            '# {name}\n\nصُنع بمولّد السمات والتخطيطات لـ Power BI من DataArcus: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## افتحه\n1. فك ضغط هذا المجلد.\n2. افتح **{name}.pbip** في Power BI Desktop.\n3. إذا اخترت البيانات التجريبية، اضغط **Refresh** مرة واحدة لتظهر.\n\n## استخدم بياناتك\nاضغط Get data ثم اسحب حقولك إلى كل عنصر. السمة والخلفية والمواضع وصفحة التلميح وتنسيق لوحة الفلاتر جاهزة.\n\nفي إصدارات Power BI Desktop الأقدم: فعّل **File > Options > Preview features > Power BI Project (.pbip) save option** و **Store reports using enhanced metadata format (PBIR)**.\n\n## راجعه في Power BI (دقيقتان)\n1. في كل صفحة، كل عنصر في مكانه على لوحته في الخلفية ويعرض بيانات.\n2. إذا بدت الألوان غير صحيحة: **View > Themes > Browse for themes** واختر ملف السمة في **{name}.Report/StaticResources/RegisteredResources**.\n3. مرّر الماوس على أي مخطط: تظهر صفحة التلميح.\n4. اضغط Ctrl مع النقر على أزرار الصفحات و **Reset filters** (وزر **Filters** إذا اخترت اللوحة المنزلقة).\n5. **View > Mobile layout**: نسخة الهاتف جاهزة.\n\nهل يبدو شيء غير صحيح؟ أرسل لقطة شاشة إلى hello@dataarcus.com.\n')
        })
      };
      return { pages, input };
    };
    const withProject = (then) => {
      const q = projectOf(false); if (!q) return;
      const { c, m, sample, bind, specs } = q; let model = q.model;
      return Promise.all([loaders.builder(), model ? loaders.bind() : null]).then(([P, DB]) => {
        if (model && model.ws) model = { byConnection: DB.connection(model.ws, model.mn) };
        const { pages, input } = inputOf(q, model);
        // (0.3.1 TT2) an Arabic download on English names: with the names the person approved, or the list to approve
        return namesFor(P, DB, input, m).then((names) => then(P, names.input, { c, m, sample, bind, specs, pages, names }));
      });
    };
    Object.assign(d, { projectOf, inputOf, withProject });
  }

  function canvasPart(d) {
    const { E, $, loaders, renderLayoutPreview, st, projectOf, inputOf } = d;
    // (0.3.1 LC1, the owner's D-1027-19 "Both A", SQ13-S2) the layout canvas draws page 1 as this download writes it:
    // the same input, the writer's measures (Pbip.fitOptions) and the design engine's fitSlots on the page's own slots,
    // in page units, as pbip-page.js places them (one rule, never a copy). The writer loads once, after the first draw
    // (until then, and when the writer can not load, the canvas shows the layout's slots). { layout, slots } or null;
    // each slot keeps i, its index in the page's slots
    let fitLoading = null;
    st.canvasFit = () => {
      const q = projectOf(true); if (!q) return null;
      const P = window.DAPbip, DB = window.DABind;
      if (!P || (q.model && !DB)) {
        if (!fitLoading) fitLoading = Promise.all([loaders.builder(), q.model ? loaders.bind() : null]).then(() => { renderLayoutPreview(); }, () => {});
        return null;
      }
      const model = q.model && q.model.ws ? { byConnection: DB.connection(q.model.ws, q.model.mn) } : q.model, sp = q.specs[0];
      return { layout: sp.layout, slots: E.fitSlots(sp.slots.map((x, i) => Object.assign({}, x, { i })), P.fitOptions(inputOf(q, model).input)[0]).slots };
    };
    // what the canvas depends on in this card: the pages, the panel, the data, the fields picked, the logo
    ['pbipPages', 'pbipPanel', 'pbipData', 'pbipMap', 'pbipLogo', 'pbipWs', 'pbipModelName'].forEach((id) => { if ($(id)) $(id).addEventListener('change', () => renderLayoutPreview()); });
  }

  // made before the download's click needs it (a definition only: the page is read, nothing is drawn)
  function checkPart(d) {
    const { $, L, isAr, own } = d;
    // 0.3.0 step 2, "Check before download" (the owner's go, 18 Oct): the measured rules and the layout check
    // (layout-check.js, the engine the MCP runs before it writes) on the project in memory, before it is offered: "0
    // problems Power BI Desktop would show" or the list, which stays in view; the download is never held back. Structure
    // only: the files' types, places, sizes and settings, and the model's column types when your own model is chosen
    const ckBox = $('pbipCheck');
    const showCheck = (C, files, m) => {
      if (!ckBox) return null;
      const tables = (m === 'local' || m === 'service') && own[m] && own[m].tables && own[m].tables.length ? own[m].tables : null;
      const r = C.checkProject(files, { lang: isAr() ? 'ar' : 'en', model: tables });
      ckBox.textContent = '';
      const head = document.createElement('p'); head.className = 'tg-ck-sum ' + (r.desktop ? 'tg-warn' : 'tg-ok'); head.textContent = r.summary; ckBox.appendChild(head);
      if (r.problems.length) {
        const ul = document.createElement('ul');
        r.problems.slice(0, 12).forEach((f) => { const li = document.createElement('li'); li.textContent = `${f.page && f.page.n ? L(`Page ${f.page.n}`, `الصفحة ${f.page.n}`) + ': ' : ''}${f.visual ? f.visual + ': ' : ''}${f.what}. ${f.fix}`; li.dir = 'auto'; ul.appendChild(li); });
        ckBox.appendChild(ul);
      }
      const note = document.createElement('small'); note.textContent = L('Checked by the measured rules of what Power BI Desktop draws and the layout check, on the project as it is set now. Structure only, never data.', 'فحصته قواعد مقيسة لما يرسمه Power BI Desktop وفحص التخطيط، على المشروع بإعداداته الحالية. البنية فقط، دون أي بيانات.');
      ckBox.appendChild(note); ckBox.hidden = false;
      return r;
    };
    Object.assign(d, { showCheck });
  }

  // the project download
  function pbipDownloadPart(d) {
    const { E, L, track, toast, page, rtl, loaders, st, pbipBtn, own, ownMsg, withProject, askNames, pngBlob, showCheck, saveBlob, fileBase } = d;
    pbipBtn.addEventListener('click', () => {
      const run = withProject((P, input, { c, m, sample, bind, specs, pages, names }) => (names.pending ? askNames(names.pending) : loaders.check().catch(() => null).then((Ck) => {
        // 0.2.9, audit 2's A2-3: each background is drawn from the slots the report gets (the writer's measures,
        // P.fitOptions, and the design engine's fitSlots, on the picture's 720 grid): a line chart's room given away with
        // no time axis (round 24's B1), and the filter rail as high as its slicers and Reset, as the report draws them
        const fo = P.fitOptions(input);
        return Promise.all(specs.map((sp, i) => pngBlob(sp.layout, (sl) => E.fitSlots(sl, E.fitScale(fo[i], 1 / page(sp.layout).s)).slots).then((b) => b.arrayBuffer()))).then((bufs) => {
        bufs.forEach((b, i) => { pages[i].png = new Uint8Array(b); });
        const r = P.build(input);
        if (Ck) showCheck(Ck, r.files, m);   // (0.3.0 step 2: checked before it is offered; the list stays in view)
        saveBlob(new Blob([r.zip()], { type: 'application/zip' }), `${fileBase()}-power-bi-${m === 'local' || m === 'service' ? 'report' : 'project'}.zip`);
        if (m === 'local') {
          const e = own.local, at = e.dir ? ` (${e.dir})` : '';
          const msg = L(`Unzip it into the folder that holds ${e.folder}${at}, then open ${r.base}.pbip`, `فك الضغط داخل المجلد الذي فيه ${e.folder}${at}، ثم افتح ${r.base}.pbip`);
          toast(msg); ownMsg(msg);
        } else toast(L('Project downloaded. Unzip it and open the .pbip file', 'تم تنزيل المشروع. فك الضغط وافتح ملف .pbip'));
        track('theme_pbip', { layout: c.preset, direction: rtl() ? 'rtl' : 'ltr', kpis: c.kpis, sample, data: m, bound: !!bind, logo: !!st.logo, page: c.page, pages: pages.length, panel: pages.some((pp) => pp.panel) });
        });
      })));
      if (!run) return;
      pbipBtn.disabled = true;
      run.catch(() => toast(L('Could not build the project in this browser', 'تعذّر إنشاء المشروع في هذا المتصفح'))).then(() => { pbipBtn.disabled = false; });
    });
  }

  function previewPart(d) {
    const { E, $, L, isAr, toast, design, page, rtl, loaders, withProject, showCheck } = d;
    // 0.3.0 step 1, "Preview before Approve": a picture of each page the download contains, drawn by the renderer the
    // MCP's approval window uses (page-preview.js) from the writer's own files: types, places, sizes, titles and field
    // names; grey placeholders, never a value
    const pvBtn = $('pbipPreviewBtn'), pvBox = $('pbipPreview');
    if (pvBtn && pvBox) pvBtn.addEventListener('click', () => {
      const run = withProject((P, input, { m, specs, pages: pp }) => Promise.all([loaders.preview(), loaders.check().catch(() => null)]).then(([PV, Ck]) => {
        // (0.3.1 GD2) a glass design's pages get the pictures the download writes (pngBlob's glass picture, each page's layout)
        if (E.isGlass(design())) specs.forEach((sp, i) => { const p = page(sp.layout); pp[i].png = E.glassPng(Object.assign({}, design(), { layout: sp.layout }), p.w, p.h); });
        const files = P.build(input).files;
        if (Ck) showCheck(Ck, files, m);
        // (0.3.1 GD2) a glass page drawn on its own picture, the bytes the project writes (a data URL: the page's policy
        // allows data: images, not blob:)
        const picture = (b) => { if (!E.isGlassPng(b)) return null; let bin = ''; for (let i = 0; i < b.length; i += 8192) bin += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return 'data:image/png;base64,' + btoa(bin); };
        const u = design().ui, pages = PV.fromFiles(files, { rtl: rtl(), colors: { background: u.background, card: u.card, ink: u.text, accent: u.accent }, picture });
        pvBox.textContent = '';
        pages.forEach((pg, i) => {
          const fig = document.createElement('figure'), cap = document.createElement('figcaption');
          fig.innerHTML = PV.render(pg, { lang: isAr() ? 'ar' : 'en', width: 640 });   // (every name in it escaped by the renderer)
          cap.textContent = L(`Page ${i + 1}: ${pg.name}`, `الصفحة ${i + 1}: ${pg.name}`);
          fig.appendChild(cap); pvBox.appendChild(fig);
        });
        const note = document.createElement('p');
        note.textContent = L('Drawn from the project as it is set now: where each visual goes, its type and its title. The grey shapes are placeholders, not data. Press again after a change.', 'مرسومة من المشروع بإعداداته الحالية: موضع كل عنصر ونوعه وعنوانه. الأشكال الرمادية للعرض فقط وليست بيانات. اضغط مرة أخرى بعد أي تغيير.');
        pvBox.appendChild(note); pvBox.hidden = false;
      }));
      if (!run) return;
      pvBtn.disabled = true;
      run.catch(() => toast(L('Could not draw the preview in this browser', 'تعذّر رسم المعاينة في هذا المتصفح'))).then(() => { pvBtn.disabled = false; });
    });
  }

  // step 3's clicks: the visual backgrounds choice and the reminder's buttons
  function statusListeners(d) {
    const { $, L, track, toast, store, hooks, lay, st, pngKey, csvKey, renderVis, downloadJson, downloadPng, downloadCsv } = d;
    $('dlVis').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-l="transparent"]'); if (!b) return;
      lay().transparent = b.dataset.v === '1'; lay().visPicked = true; st.autoSwitched = false; renderVis(); hooks.renderJson(); store.save();
      track('theme_visuals', { transparent: lay().transparent });
    });
    const DL = { json: () => downloadJson('reminder'), png: downloadPng, csv: downloadCsv };
    document.querySelector('main.tg').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-dl]'); if (!b) return;
      const a = b.dataset.dl;
      // several files one after another, so the browser does not merge or block them
      if (a === 'stale') [['json', st.lastJson !== null && st.lastJson !== JSON.stringify(hooks.buildTheme(), null, 2)], ['png', st.lastPng !== null && st.lastPng !== pngKey()], ['csv', st.lastCsv !== null && st.lastCsv !== csvKey()]]
        .filter((f) => f[1]).forEach((f, i) => setTimeout(DL[f[0]], i * 400));
      else if (a === 'transparent') { lay().transparent = true; lay().visPicked = true; renderVis(); hooks.renderJson(); store.save(); toast(L('Visuals are transparent. Download the theme again', 'أصبحت العناصر شفافة. نزّل السمة من جديد')); }
    });
  }

  const api = { mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAThemeDownloadUI = api;
})(typeof self !== 'undefined' ? self : this);
