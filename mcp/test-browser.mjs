// A browser for the tests (A-01): the server opens its approval window with this program (DATAARCUS_BROWSER), and it
// does what DATAARCUS_TEST_CLICK says: "approve" (default) or "decline" clicks the page's button as the page itself
// would (its Origin); "none" only loads the page; "log:<file>" writes the link to that file and does nothing else.
import http from 'node:http';
import fs from 'node:fs';
const url = new URL(process.argv[process.argv.length - 1]), how = process.env.DATAARCUS_TEST_CLICK || 'approve';
const req = (method, body, headers) => new Promise((resolve, reject) => {
  const r = http.request(url, { method, headers: Object.assign({ Host: url.host }, headers || {}) }, (res) => { let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => resolve({ code: res.statusCode, t })); });
  r.on('error', reject); if (body) r.write(body); r.end();
});
if (how.startsWith('log:')) fs.appendFileSync(how.slice(4), url.href + '\n');
else {
  const page = await req('GET');
  if (page.code === 200 && (how === 'approve' || how === 'decline')) await req('POST', 'decision=' + how, { Origin: url.origin, 'Content-Type': 'application/x-www-form-urlencoded' });
}
