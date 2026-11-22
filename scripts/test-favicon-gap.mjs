// node scripts/test-favicon-gap.mjs   (LG3, D-1122-06: "a space between the bars and the arc inside the arc")
// The smallest gap between the arc's stroke (round caps included) and any bar, in the 40x40 box of assets/img/favicon.svg
// (the inner group's scale applied), must be at least 1.0. assets/img/logo.svg is measured the same way as the reference.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MIN_GAP = 1.0;
const num = (s, a) => { const m = new RegExp('(?:^|\\s)' + a + '="([-\\d.]+)"').exec(s); return m ? Number(m[1]) : 0; };

// the smallest distance of the arc's stroke to the bars, in the svg's own units, then times the group scale
export function smallestGap(svg) {
  const arc = /<path d="M([\d.]+) ([\d.]+)A([\d.]+) [\d.]+ 0 1 1 ([\d.]+) ([\d.]+)"[^>]*stroke-width="([\d.]+)"/.exec(svg);
  if (!arc) throw new Error('no arc path found');
  const [x0, y0, r, , , sw] = arc.slice(1).map(Number);
  const bars = [...svg.matchAll(/<rect [^>]*fill="#00d4ff"[^>]*>/g)].map((m) => ({ x: num(m[0], 'x'), y: num(m[0], 'y'), w: num(m[0], 'width'), h: num(m[0], 'height'), rx: num(m[0], 'rx') }));
  if (bars.length !== 3) throw new Error('expected 3 bars, found ' + bars.length);
  // the arc: centre where its start point sits at 135 degrees (bottom left), clockwise 270 degrees over the top
  const c = [x0 + r * Math.SQRT1_2, y0 - r * Math.SQRT1_2];
  const sd = (b, px, py) => { // signed distance from a point to a rounded rectangle
    const qx = Math.abs(px - (b.x + b.w / 2)) - (b.w / 2 - b.rx), qy = Math.abs(py - (b.y + b.h / 2)) - (b.h / 2 - b.rx);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - b.rx;
  };
  let min = Infinity;
  for (let i = 0; i <= 27000; i++) {
    const a = (135 + i / 100) * Math.PI / 180;
    const px = c[0] + r * Math.cos(a), py = c[1] + r * Math.sin(a);
    for (const b of bars) min = Math.min(min, sd(b, px, py) - sw / 2);
  }
  const g = /<g transform="translate\([-\d.]+ [-\d.]+\) scale\(([\d.]+)\)/.exec(svg);
  return min * (g ? Number(g[1]) : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (f) => fs.readFileSync(path.join(ROOT, 'assets/img', f), 'utf8');
  const problems = []; let checks = 0;
  const ok = (c, m) => { checks++; if (!c) problems.push(m); };
  const fav = smallestGap(read('favicon.svg')), logo = smallestGap(read('logo.svg'));
  console.log(`favicon.svg smallest gap ${fav.toFixed(2)} of 40; logo.svg ${logo.toFixed(2)}`);
  ok(fav >= MIN_GAP, `G1 favicon.svg: smallest bar-to-arc gap ${fav.toFixed(2)} of 40, needs at least ${MIN_GAP}`);
  ok(logo >= MIN_GAP, `G2 logo.svg (the reference): smallest gap ${logo.toFixed(2)} of 40, needs at least ${MIN_GAP}`);
  if (problems.length) {
    console.log(`FAIL script=scripts/test-favicon-gap.mjs check="${problems[0]}" cause=checks-failed`);
    problems.forEach((p) => console.log('  - ' + p));
    console.log(`FAIL  favicon-gap  ${checks - problems.length}/${checks} checks`);
    process.exit(1);
  }
  console.log(`PASS  favicon-gap  ${checks} checks`);
}
