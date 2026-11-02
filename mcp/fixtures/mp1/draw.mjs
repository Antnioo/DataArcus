// MP1's made-up page pictures, drawn by the tests (never a real report's): a layout is a frame colour and panels, each
// a rectangle in fractions of the picture (x0, y0, x1, y1) with its own colour; draw() paints them on an RGBA picture.
// The JPEG copies under this folder are these drawings saved by make.mjs (ImageMagick), so the decoder is checked
// against pictures another encoder wrote.
export const LAYOUTS = {
  // a left rail and two panels (the Call Center shape)
  rail: { frame: [40, 44, 52], panels: [{ id: 'rail', at: [0, 0, 0.12, 1], rgb: [16, 60, 120] }, { id: 'left', at: [0.16, 0.1, 0.55, 0.9], rgb: [250, 250, 250] }, { id: 'right', at: [0.59, 0.1, 0.97, 0.9], rgb: [200, 226, 250] }] },
  // three card columns, each its own colour
  cols: { frame: [236, 238, 242], panels: [{ id: 'c1', at: [0.04, 0.2, 0.3, 0.8], rgb: [255, 214, 160] }, { id: 'c2', at: [0.36, 0.2, 0.62, 0.8], rgb: [170, 230, 180] }, { id: 'c3', at: [0.68, 0.2, 0.96, 0.8], rgb: [190, 170, 240] }] },
  // a header band with a square at its left, a body panel at the left
  band: { frame: [245, 245, 245], panels: [{ id: 'band', at: [0, 0, 1, 0.2], rgb: [20, 33, 61] }, { id: 'mark', at: [0.02, 0.03, 0.1, 0.17], rgb: [230, 120, 40] }, { id: 'body', at: [0.03, 0.27, 0.62, 0.95], rgb: [255, 255, 255] }] }
};
// the picture sizes: Fit and Fill use one of another shape than the 640 x 360 page; Normal one narrower than the page
export const PAGE = { w: 640, h: 360 }, SIZES = { wide: [400, 250], narrow: [520, 360] };
export function draw(layout, w, h, opts) {
  const L = LAYOUTS[layout], rgba = new Uint8Array(w * h * 4), o = opts || {};
  const fill = (x0, y0, x1, y1, c) => { for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) { const i = (y * w + x) * 4; rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = 255; } };
  fill(0, 0, w, h, L.frame);
  L.panels.forEach((p) => fill(Math.round(p.at[0] * w), Math.round(p.at[1] * h), Math.round(p.at[2] * w), Math.round(p.at[3] * h), p.rgb));
  // (opts.words: a line of small dark marks on one baseline in the first panel, as a word painted in the picture)
  if (o.words) { const p = L.panels[L.panels.length - 1], x = Math.round(p.at[0] * w) + 12, y = Math.round(p.at[1] * h) + 14; for (let k = 0; k < 7; k++) fill(x + k * 11, y + (k % 2 ? 3 : 0), x + k * 11 + 7, y + 14, [30, 30, 30]); }
  return rgba;
}
