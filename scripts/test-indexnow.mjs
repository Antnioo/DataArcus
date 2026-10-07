// Tests for scripts/indexnow.mjs: which addresses a push sends to IndexNow (Bing, Yandex and the others that share it),
// and the key file the site publishes to prove it owns them. No network.
//   node scripts/test-indexnow.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { urlsFor, payload, keyFile } from './indexnow.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0, fails = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL ' + msg); } };
const eq = (got, want, msg) => ok(JSON.stringify(got) === JSON.stringify(want), `${msg}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const LOCS = ['https://dataarcus.com/', 'https://dataarcus.com/tools/', 'https://dataarcus.com/blog.html', 'https://dataarcus.com/tools/svg-kpi-designer.html'];
eq(urlsFor(['index.html'], LOCS), ['https://dataarcus.com/'], 'the home page file is the address "/"');
eq(urlsFor(['tools/index.html'], LOCS), ['https://dataarcus.com/tools/'], 'a folder\'s index.html is the folder address');
eq(urlsFor(['blog.html', 'tools/svg-kpi-designer.html'], LOCS), ['https://dataarcus.com/blog.html', 'https://dataarcus.com/tools/svg-kpi-designer.html'], 'changed pages in the sitemap are sent');
eq(urlsFor(['go/svg/index.html', 'mcp/WORK.md', 'scripts/csp.mjs', 'assets/js/lang-manager.js'], LOCS), [], 'short links, notes, code and assets are not pages in the sitemap');
eq(urlsFor(['blog.html', 'blog.html'], LOCS), ['https://dataarcus.com/blog.html'], 'each address once');
eq(urlsFor(['sitemap.xml'], LOCS), [], 'a sitemap change alone sends nothing (the sitemap is read by the engines anyway)');
eq(urlsFor(['tools\\svg-kpi-designer.html'], LOCS), ['https://dataarcus.com/tools/svg-kpi-designer.html'], 'Windows paths too');

const KEY = '0123456789abcdef0123456789abcdef';
eq(payload(['https://dataarcus.com/'], KEY), { host: 'dataarcus.com', key: KEY, keyLocation: `https://dataarcus.com/${KEY}.txt`, urlList: ['https://dataarcus.com/'] }, 'the request body');

// the site's own key file: one file at the root named after the key, holding only the key, and published by Pages
const k = keyFile(ROOT);
ok(k && /^[a-f0-9]{32}$/.test(k.key), 'one IndexNow key file <32 hex>.txt at the site root');
if (k) eq(fs.readFileSync(path.join(ROOT, `${k.key}.txt`), 'utf8').trim(), k.key, 'the key file holds its own key');
ok(!/exclude:.*\.txt/.test(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8')), '_config.yml must not exclude the key file');

console.log(`${checks - fails}/${checks} IndexNow checks passed`);
process.exit(fails ? 1 : 0);
