// Writes the JPEG copies of MP1's made-up pictures (run once, by hand; needs ImageMagick's convert and Python's Pillow). The tests read the
// JPEGs and draw the PNGs themselves.  node fixtures/mp1/make.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { LAYOUTS, SIZES, draw } from './draw.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), { PNG } = createRequire(import.meta.url)('pngjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1-make-'));
const save = (name, layout, size, args) => {
  const [w, h] = SIZES[size], png = new PNG({ width: w, height: h }); png.data = Buffer.from(draw(layout, w, h));
  const src = path.join(tmp, name + '.png'); fs.writeFileSync(src, PNG.sync.write(png));
  execFileSync('convert', [src, ...args, path.join(HERE, name + '.jpg')]);
};
Object.keys(LAYOUTS).forEach((layout) => Object.keys(SIZES).forEach((size) => save(`${layout}-${size}`, layout, size, ['-quality', '92'])));
// a progressive one (4:4:4) and a baseline one with restart markers, to read both ways
save('rail-wide-progressive', 'rail', 'wide', ['-quality', '90', '-interlace', 'JPEG', '-sampling-factor', '1x1']);
save('cols-wide-restart', 'cols', 'wide', ['-quality', '85']);
// (convert writes no restart markers: Pillow writes them, every 3 blocks)
execFileSync('python3', ['-I', '-c', "import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[1], 'JPEG', quality=85, restart_marker_blocks=3)", path.join(HERE, 'cols-wide-restart.jpg')]);
fs.rmSync(tmp, { recursive: true, force: true });
