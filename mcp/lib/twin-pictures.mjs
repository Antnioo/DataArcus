// The Arabic twin's pages drawn on a picture (0.3.1 MP1, D-1029-03: "I want all the pages to be mirrored rtl"): each
// page's picture read, flipped left to right (lib/page-picture.mjs) and written as a new PNG of the Arabic page's own,
// the visuals mirrored onto it; a picture that may hold words is asked before it is flipped (flipPictures); a wallpaper
// (outspace) is kept as it is. Called by twin-plan.mjs twice: picturesOf before the build, flipPicturesOf after it.
import { safeName } from './read-report.mjs';
import { bytesAt, isObj, pageOf } from './twin-read.mjs';
import { pagePicture, offPanel, newOverlaps } from './page-picture.mjs';

export const RES = 'StaticResources/RegisteredResources/';
const lit = (p) => (isObj(p) && isObj(p.expr) && isObj(p.expr.Literal) && typeof p.expr.Literal.Value === 'string' ? p.expr.Literal.Value.replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const Ls = (s) => ({ expr: { Literal: { Value: "'" + String(s).replace(/'/g, "''") + "'" } } });
// a page's pictures in one of its cards (background, outspace): [{ entry's image object, name, fit }]
const imagesIn = (page, card) => (isObj(page) && isObj(page.objects) && Array.isArray(page.objects[card]) ? page.objects[card] : [])
  .map((e) => (isObj(e) && isObj(e.properties) && isObj(e.properties.image) && isObj(e.properties.image.image) ? e.properties.image.image : null))
  .filter((im) => im && lit(im.name) != null).map((im) => ({ im, name: lit(im.name), fit: lit(im.scaling) }));

// what the plan, the answer and the approval page say of a page, in English and Arabic
const FIT_AR = { Normal: 'بحجمها الأصلي', Fit: 'ملاءمة', Fill: 'تعبئة' };
export const WORDS_SAID = 'This picture may contain words or a logo that will read backwards';
const WORDS_SAID_AR = 'قد تحتوي هذه الصورة على كلمات أو شعار سيُقرأ معكوسًا';
export function pictureSaid(x, mirrorPictures) {
  if (x.picture === 'flipped') return { en: `picture flipped (${x.padded ? 'Normal, drawn on the page first' : x.fit}) and the visuals mirrored onto it`, ar: `الصورة معكوسة أفقيًا (${FIT_AR[x.fit] || FIT_AR.Normal}${x.padded ? '، بعد رسمها على حجم الصفحة' : ''}) والمرئيات معكوسة فوقها` };
  if (x.picture === 'asked') return mirrorPictures ? { en: `asked: ${WORDS_SAID}. Mirrored as asked (mirrorPicturePages); its picture is not flipped, so the visuals leave its panels`, ar: `${WORDS_SAID_AR}. عُكست الصفحة كما طُلب، أما صورتها فلم تُعكس، فتخرج المرئيات عن ألواحها` }
    : { en: `asked: ${WORDS_SAID}. The page stays left to right until the user approves its flip (flipPictures)`, ar: `${WORDS_SAID_AR}. تبقى الصفحة من اليسار إلى اليمين حتى توافق على عكس صورتها` };
  if (x.wallpaper) return { en: 'kept: its wallpaper picture (outside the page, placed by the window) stays as it is; the page is mirrored', ar: 'تبقى صورة ما حول الصفحة كما هي (خارج الصفحة)، والصفحة معكوسة' };
  return mirrorPictures ? { en: `mirrored as asked (mirrorPicturePages); its picture is not flipped (${x.why})`, ar: `عُكست الصفحة كما طُلب، أما صورتها فلم تُعكس (تعذّرت قراءتها)` }
    : { en: `kept left to right: ${x.why}; mirrorPicturePages true mirrors it anyway (the picture as it is)`, ar: 'تبقى من اليسار إلى اليمين: تعذّرت قراءة صورتها' };
}

/** Each page's pictures, before the build: Map page id -> { picture: 'flipped' | 'asked' | 'kept', fit, rel, name, ...,
 *  wallpaper (an outspace picture), why (kept: why the picture can't be flipped), words }. blank(name): DataArcus's own
 *  placeholder or glass picture (not a picture here). flip: the page ids the user approved the flip of. */
export function picturesOf(R, loc, blank, flip) {
  const info = new Map(), approved = new Set((Array.isArray(flip) ? flip : []).map(String));
  R.pages.forEach((pg) => {
    const page = pageOf(pg), bg = imagesIn(page, 'background').filter((x) => !blank(x.name)), wall = imagesIn(page, 'outspace').concat(imagesIn(page, 'wallpaper')).filter((x) => !blank(x.name));
    if (!bg.length) { if (wall.length) info.set(String(pg.id), { picture: 'kept', wallpaper: true, name: wall[0].name }); return; }
    const x = bg[0], rel = RES + x.name, W = page.width, H = page.height, fit = ['Normal', 'Fit', 'Fill'].includes(x.fit) ? x.fit : 'Normal';
    const out = { name: x.name, rel, fit, ...(wall.length ? { wallpaperToo: true } : {}) };
    if (!R.files.includes(rel)) return info.set(String(pg.id), Object.assign(out, { picture: 'kept', why: 'its picture file is not in the report' }));
    if (!(Number.isFinite(W) && Number.isFinite(H) && W > 0 && H > 0)) return info.set(String(pg.id), Object.assign(out, { picture: 'kept', why: 'its page size is not a number' }));
    let P; try { P = pagePicture(new Uint8Array(bytesAt(loc, rel)), fit, W, H); } catch (e) { P = { why: 'its picture could not be read' }; }
    if (P.why) return info.set(String(pg.id), Object.assign(out, { picture: 'kept', why: P.why }));
    info.set(String(pg.id), Object.assign(out, { picture: P.words && !approved.has(String(pg.id)) ? 'asked' : 'flipped', padded: P.padded, words: P.words > 0, size: `${P.iw} x ${P.ih}`, W, H }));
  });
  return info;
}

/** After the build: each flipped page's picture written as a new PNG of the Arabic pages (a free name "<name>-ar.png";
 *  one file for the pages that share a picture, fit and size; none when the flip is the picture itself), the built
 *  Arabic page pointed to it, and the boxes checked (offPanel, newOverlaps). Sets built.addedPictures ([{ name, data }])
 *  and built.pictureChecks. */
export function flipPicturesOf(R, loc, info, built, keepLtr) {
  const taken = new Set(R.files.filter((f) => f.startsWith(RES)).map((f) => f.slice(RES.length).toLowerCase())), byKey = new Map(), added = [];
  const checks = { offPanel: [], newOverlaps: [] };
  built.pages.forEach(({ pg, page, visuals }) => {
    const x = info.get(String(pg.id)); if (!x || x.picture !== 'flipped' || keepLtr(pg) || !isObj(page)) return;
    const P = pagePicture(new Uint8Array(bytesAt(loc, x.rel)), x.fit, x.W, x.H); if (P.why) return;
    let to = x.name;
    if (!P.same) {
      const key = x.rel + '|' + x.fit + '|' + x.W + 'x' + x.H;
      if (byKey.has(key)) to = byKey.get(key);
      else { const base = x.name.replace(/\.[^.]*$/, ''); to = base + '-ar.png'; for (let k = 2; taken.has(to.toLowerCase()); k++) to = base + '-ar-' + k + '.png'; taken.add(to.toLowerCase()); byKey.set(key, to); added.push({ name: to, data: Buffer.from(P.png) }); }
      imagesIn(page, 'background').filter((y) => y.name === x.name).forEach(({ im }) => { im.name = Ls(to); if (isObj(im.url) && isObj(im.url.expr) && isObj(im.url.expr.ResourcePackageItem)) im.url.expr.ResourcePackageItem.ItemName = to; });
    }
    x.writtenAs = to;
    const en = pg.visuals.map((v) => v.json), at = (n) => safeName(pg.id) + '/' + safeName(n);
    offPanel(P, en, visuals, x.fit, x.W, x.H).forEach((n) => checks.offPanel.push({ where: at(n), what: 'it sat on a panel of the English picture; mirrored, it is not on the same panel of the flipped picture', whatAr: 'كان على لوح في صورة الصفحة الإنجليزية، وبعد العكس لم يعد على اللوح نفسه في الصورة المعكوسة' }));
    newOverlaps(en, visuals).forEach((o) => checks.newOverlaps.push({ where: safeName(pg.id) + ': ' + o.visuals.map((n) => safeName(n)).join(', '), what: 'these visuals overlap in the twin and did not in the English page', whatAr: 'تتداخل هذه المرئيات في النسخة العربية ولم تكن تتداخل في الصفحة الإنجليزية' }));
  });
  built.addedPictures = added;
  built.pictureChecks = checks.offPanel.length || checks.newOverlaps.length ? checks : null;
}

/** The answer's picturePages: one entry per page with a picture, as the plan and the approval page say it */
export function picturePagesSaid(R, info, mirrorPictures) {
  return R.pages.filter((pg) => info.has(String(pg.id))).map((pg) => {
    const x = info.get(String(pg.id)), s = pictureSaid(x, mirrorPictures);
    const name = typeof pageOf(pg).displayName === 'string' ? safeName(pageOf(pg).displayName) : '';
    return Object.assign({ page: safeName(pg.id) }, name ? { name } : {}, { picture: x.picture }, x.fit && !x.wallpaper ? { fit: x.fit } : {}, x.picture === 'flipped' ? { padded: !!x.padded } : {},
      x.picture === 'asked' ? { flipWith: `flipPictures: ["${safeName(pg.id)}"] once the user has looked at the picture and approves its flip` } : {}, x.wallpaperToo ? { wallpaper: 'its wallpaper picture (outside the page) stays as it is' } : {}, { what: s.en, whatAr: s.ar });
  });
}

/** report.json with the new pictures registered (RegisteredResources), or null when there is nothing to add */
export function registered(j, names) {
  if (!isObj(j) || !names.length) return null;
  if (!Array.isArray(j.resourcePackages)) j.resourcePackages = [];
  let pk = j.resourcePackages.find((x) => isObj(x) && x.name === 'RegisteredResources');
  if (!pk) { pk = { name: 'RegisteredResources', type: 'RegisteredResources', items: [] }; j.resourcePackages.push(pk); }
  if (!Array.isArray(pk.items)) pk.items = [];
  names.forEach((n) => pk.items.push({ name: n, path: n, type: 'Image' }));
  return j;
}
