// 0.3.2 FN1B (mount, init and create into named steps; mcp/work/FN1B.md): parts of the pages that no website suite
// turned red when broken on the base (5e7eff3b), pinned as they behave today.
//   P1 the Theme Generator's background PNG (theme-download-ui.js pngPart): right after its header, the two text chunks
//      that credit DataArcus (Software, Source), each with a valid CRC, and the picture's own chunks after them
import fs from 'node:fs';
import zlib from 'node:zlib';
import { visitor, ready } from './lib.mjs';

// the PNG's chunks: { type, data, crcOk }
const chunks = (buf) => {
  const out = [];
  for (let at = 8; at + 12 <= buf.length;) {
    const n = buf.readUInt32BE(at), type = buf.toString('latin1', at + 4, at + 8), data = buf.subarray(at + 8, at + 8 + n);
    const crcOk = zlib.crc32(buf.subarray(at + 4, at + 8 + n)) === buf.readUInt32BE(at + 8 + n);
    out.push({ type, data, crcOk });
    at += 12 + n;
  }
  return out;
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

  // P1 (the plain design: its background is drawn on a canvas, then credited; the glass picture comes from the engine)
  {
    const v = await visitor(browser, { downloads: true, plainDesign: true });
    try {
      await v.pg.goto(`${url}/tools/power-bi-theme-generator.html?lang=en`, { waitUntil: 'networkidle' });
      await ready(v.pg);
      const [d] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#pngBtn')]);
      const buf = fs.readFileSync(await d.path()), cs = chunks(buf);
      const text = cs.filter((c) => c.type === 'tEXt').map((c) => c.data.toString('latin1'));
      const want = ['Software\0DataArcus Power BI Theme & Layout Generator', 'Source\0https://dataarcus.com/tools/power-bi-theme-generator.html'];
      const order = cs.map((c) => c.type).slice(0, 4).join(' ');
      check(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && order === 'IHDR tEXt tEXt IDAT' && JSON.stringify(text) === JSON.stringify(want)
        && cs.every((c) => c.crcOk) && cs[cs.length - 1].type === 'IEND' && !v.errs.length,
      `P1 the background PNG must carry, after its header, the credits ${JSON.stringify(want)}: got chunks "${order}", text ${JSON.stringify(text)}, CRCs ${cs.every((c) => c.crcOk) ? 'valid' : 'broken'} ${v.errs.join(' | ')}`.trim());
    } finally { await v.ctx.close(); }
  }
  return { checks, problems };
}
