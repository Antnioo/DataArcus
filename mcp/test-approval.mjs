// DataArcus's own approval window (A-01: the outside review of rc.14; the owner's rc.16 test in Claude Desktop answered
// approvedBy "assistant-reported", and his decision of 14 Oct: only a click of the person approves). test.mjs runs it
// (import { approvalWindow }); alone:
//   node test-approval.mjs
//   W-01: approve_plan opens the window and, with no click, answers "waiting": nothing approved, nothing written, and no
//         answer holds the window's link (the assistant never gets it); a typed "go" approves nothing
//   W-02: the page shows the plan (name, title, fields, names, options, files), every text escaped; served on 127.0.0.1
//         only, with a no-script policy, no framing, no referrer
//   W-03: a click is taken only from the page itself: another Host (a rebound name), another Origin, no Origin, a wrong
//         link: all refused, nothing approved
//   W-04: the click on Approve approves (approvedBy user-in-browser) and the write goes through; a later click changes nothing
//   W-05: "Not now" refuses, and the plan writes nothing
//   W-06: reopen opens the same link again; without it no second window
//   W-07: an expired plan's link answers "no longer valid" and approves nothing
//   W-08: a browser that can't be started: refused, said so, nothing approved
//   W-09: (0.3.0 step 1, "Preview before Approve") the page shows a picture of each planned page above Approve, drawn by
//         the shared renderer (assets/js/page-preview.js) from the plan only: every name in it escaped, no value
//   W-10: one picture per page of the plan (a second page: two); an Arabic plan's picture is right to left
//   W-11: the pictures change nothing of the window's security: the same headers (no scripts), no image or link, and
//         opening the page approves nothing
//   W-12: (0.3.0 step 2, "Check before write") the page says what the check of the planned pages found ("0 problems Power
//         BI Desktop would show", or the list) next to the preview, above Approve
//   W-13: create_report checks the project before it writes it and its answer says the result; the check never approves
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const req = (url, { method = 'GET', host, origin, site, body } = {}) => new Promise((resolve) => {
  const u = new URL(url), h = { Host: host || u.host };
  if (origin) h.Origin = origin;
  if (site) h['Sec-Fetch-Site'] = site;
  if (body) h['Content-Type'] = 'application/x-www-form-urlencoded';
  const r = http.request(u, { method, headers: h }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve({ code: res.statusCode, t, h: res.headers })); });
  r.on('error', (e) => resolve({ code: 0, t: String(e.message), h: {} })); if (body) r.write(body); r.end();
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function approvalWindow({ check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
  fs.mkdirSync(path.join(ROOT, 'aw', 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'aw', 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' }],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } }));
  const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
  // (the browser is a program of its own: its link lands a moment after approve_plan answers)
  const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
  const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);

  // a server whose window is opened by a browser that only notes its link (the test clicks, as the person would)
  const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '300' });
  try {
    const title = 'Sales <script>alert(1)</script> & "more"';
    const pl = await s.call('plan_layout', { path: 'aw', layout: 'exec', name: 'Window Test', title, planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]' }, secondPage: false });
    const pid = pl.j && pl.j.plan && pl.j.plan.planId;
    chk(() => /^plan-/.test(pid), () => `W setup. plan_layout gives a plan id: ${short(pl)}`);

    // ---------- W-01: no click: waiting, nothing approved, no link in the answer; a typed go approves nothing ----------
    const w = await s.call('approve_plan', { planId: pid, userReply: 'go' });
    const link = await linkAt(0);
    chk(() => !w.err && w.j.status === 'waiting' && w.j.approvedBy === null && /click Approve/.test(w.j.sayFirst), () => `W-01. no click yet: status waiting, not approved, says to click Approve: ${short(w)}`);
    chk(() => /^http:\/\/127\.0\.0\.1:\d+\/approve\/[A-Za-z0-9_-]{30,}$/.test(link), () => `W-01. the window was opened on 127.0.0.1 with a secret link: ${link}`);
    const secret = link.split('/').pop();
    chk(() => secret && !w.t.includes(secret) && !pl.t.includes(secret) && !/127\.0\.0\.1/.test(w.t), () => 'W-01. no answer holds the window\'s link or its secret');
    const early = await s.call('create_report', { path: 'aw', planId: pid, name: 'Window Test', title, fields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]' }, secondPage: false, design: pl.j.design });
    chk(() => early.err && /not approved yet/.test(early.t) && /approval window/.test(early.t) && !fs.existsSync(path.join(ROOT, 'aw', 'Window Test.Report')), () => `W-01. before the click the plan writes nothing: ${short(early)}`);

    // ---------- W-02: the page ----------
    const page = await req(link);
    chk(() => page.code === 200 && page.t.includes('Window Test') && page.t.includes('Sales[Total Sales]') && page.t.includes('Sales[Region]') && /Approve<\/button>/.test(page.t) && /Not now<\/button>/.test(page.t) && /Files that will be written/.test(page.t), () => `W-02. the page shows the plan and both buttons: ${page.code} ${page.t.slice(0, 300)}`);
    chk(() => page.t.includes('Sales &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;more&quot;') && !page.t.includes('<script>alert(1)'), () => 'W-02. every text of the plan is escaped (no markup from a name or title)');
    chk(() => /default-src 'none'/.test(page.h['content-security-policy'] || '') && !/script-src/.test(page.h['content-security-policy'] || '') && page.h['x-frame-options'] === 'DENY' && page.h['referrer-policy'] === 'same-origin' && /no-store/.test(page.h['cache-control'] || ''), () => `W-02. no scripts, no framing, no referrer to other sites, not cached: ${JSON.stringify(page.h)}`);
    chk(() => /Second page[\s\S]*no/.test(page.t) && /Executive summary/.test(page.t), () => 'W-02. the page shows the layout and options');

    // ---------- W-09: the preview of the planned page, above Approve ----------
    const svgs = (t) => [...t.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map((m) => m[0]);
    const pics = svgs(page.t);
    chk(() => pics.length === 1 && page.t.indexOf('<svg') < page.t.indexOf('Approve</button>') && /class="card preview"/.test(page.t), () => `W-09. one picture of the planned page, above Approve: ${pics.length} picture(s)`);
    chk(() => pics.every((x) => /data-kind="card"/.test(x) && /data-kind="(bar|column|line)"/.test(x) && />preview<\/text>/.test(x)), () => 'W-09. the picture draws the plan\'s cards and charts and says "preview"');
    chk(() => !/<script/i.test(page.t) && pics.join('').includes('Sales &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;more&quot;'), () => 'W-09. the title in the picture is escaped text (no markup from it)');
    // (a number only inside a title the plan names, "(2)" of the writer's second chart by the same field included; never in
    // a placeholder or anywhere else)
    const untitled = (x) => [...x.matchAll(/<text\b(?![^>]*class="t")[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    chk(() => pics.every((x) => untitled(x).every((t) => !/\d/.test(t)) && [...x.matchAll(/<g class="ph">([\s\S]*?)<\/g>/g)].every((m) => !/<text/.test(m[1]))), () => `W-09. no number in the picture outside the plan's titles: drawn from the plan, never a value: ${pics.flatMap(untitled).filter((t) => /\d/.test(t)).join(' | ')}`);

    // ---------- W-12: the check, next to the preview, above Approve ----------
    chk(() => /Checked before writing/.test(page.t) && /0 problems Power BI Desktop would show/.test(page.t) && page.t.indexOf('Checked before writing') < page.t.indexOf('Approve</button>'), () => `W-12. the page says the check's result above Approve: ${(/Checked before writing[\s\S]{0,300}/.exec(page.t) || [''])[0]}`);

    // ---------- W-03: only the page itself can click ----------
    const here = new URL(link).origin, body = 'decision=approve';
    const rebound = await req(link, { method: 'POST', host: 'evil.example:' + new URL(link).port, origin: here, body });
    const other = await req(link, { method: 'POST', origin: 'https://evil.example', body });
    const port2 = await req(link, { method: 'POST', origin: 'http://127.0.0.1:1', body });
    const none = await req(link, { method: 'POST', body });
    const cross = await req(link, { method: 'POST', site: 'cross-site', body });
    const nul = await req(link, { method: 'POST', origin: 'null', body }), nulCross = await req(link, { method: 'POST', origin: 'null', site: 'cross-site', body });
    const wrong = await req(link.replace(/[^/]+$/, 'A'.repeat(32)), { method: 'POST', origin: here, body });
    const still = await s.call('approve_plan', { planId: pid });
    chk(() => rebound.code === 421 && other.code === 403 && port2.code === 403 && none.code === 403 && cross.code === 403 && nul.code === 403 && nulCross.code === 403 && wrong.code === 404, () => `W-03. refused: another Host ${rebound.code}, another Origin ${other.code}, another port ${port2.code}, no Origin ${none.code}, cross-site ${cross.code}, Origin null ${nul.code} / with cross-site ${nulCross.code}, a wrong link ${wrong.code}`);
    chk(() => !still.err && still.j.status === 'waiting', () => `W-03. none of them approved the plan: ${short(still)}`);
    chk(() => links().length === 1, () => `W-06. approve_plan again without reopen opens no second window: ${links().length}`);

    // ---------- W-04: the click on Approve ----------
    const click = await req(link, { method: 'POST', origin: here, body });
    chk(() => click.code === 200 && /Approved\./.test(click.t), () => `W-04. the click on Approve answers Approved: ${click.code} ${click.t.slice(0, 200)}`);
    const later = await req(link, { method: 'POST', origin: here, body: 'decision=decline' });
    const ok = await s.call('approve_plan', { planId: pid });
    chk(() => /Approved\./.test(later.t) && !ok.err && ok.j.status === 'approved' && ok.j.approvedBy === 'user-in-browser' && ok.j.allows.join() === 'create_report', () => `W-04. approved by the person in the window (a later "Not now" changes nothing): ${short(ok)}`);
    const wrote = await s.call('create_report', { path: 'aw', planId: pid, name: 'Window Test', title, fields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]' }, secondPage: false, design: pl.j.design });
    chk(() => !wrote.err && fs.existsSync(path.join(ROOT, 'aw', 'Window Test.Report')), () => `W-04. the approved plan writes its report: ${short(wrote)}`);
    chk(() => !wrote.err && wrote.j.check && /Power BI Desktop would show/.test(wrote.j.check.summary) && Number.isInteger(wrote.j.check.desktop) && Array.isArray(wrote.j.check.problems), () => `W-13. create_report says what the check before writing found: ${short(wrote)}`);
    chk(() => !early.err === false && !(early.j && early.j.check), () => 'W-13. before the click nothing is written and nothing is checked: the check never approves');

    // ---------- W-05: Not now ----------
    const t1 = await s.call('generate_theme', { brand: '#0F766E', name: 'Window Theme' }), tid = t1.j && t1.j.plan && t1.j.plan.planId;
    await s.call('approve_plan', { planId: tid });
    const tlink = await linkAt(1);
    const tpage = await req(tlink);
    chk(() => tpage.code === 200 && /Theme file/.test(tpage.t) && /#0F766E/.test(tpage.t), () => `W-02. a theme plan's page shows its inputs: ${tpage.t.slice(0, 200)}`);
    const nope = await req(tlink, { method: 'POST', origin: new URL(tlink).origin, body: 'decision=decline' });
    const refused = await s.call('approve_plan', { planId: tid });
    const before = tree(ROOT).length, tw = await s.call('generate_theme', { brand: '#0F766E', name: 'Window Theme', planId: tid });
    // (rc.22, B-134: after "Not now" the plan is refused, no longer "not approved yet")
    chk(() => /Not approved\./.test(nope.t) && refused.err && /Not now/.test(refused.t) && tw.err && /refused/.test(tw.t) && tree(ROOT).length === before, () => `W-05. "Not now" refuses and writes nothing: ${short(refused)} / ${short(tw)}`);

    // ---------- W-10: one picture per page; an Arabic plan right to left ----------
    const two = await s.call('plan_layout', { path: 'aw', layout: 'analysis', name: 'Two Pages', planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]' } });
    await s.call('approve_plan', { planId: two.j.plan.planId }); const twoPage = await req(await linkAt(2));
    chk(() => svgs(twoPage.t).length === 2 && /Two Pages/.test(twoPage.t), () => `W-10. a plan with a second page shows two pictures: ${svgs(twoPage.t).length}`);
    const ar = await s.call('plan_layout', { path: 'aw', layout: 'exec', lang: 'ar', name: 'Arabic Plan', planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]' }, secondPage: false });
    await s.call('approve_plan', { planId: ar.j.plan.planId }); const arPage = await req(await linkAt(3));
    chk(() => svgs(arPage.t).length === 1 && /معاينة/.test(svgs(arPage.t)[0]) && /<text class="t"[^>]*text-anchor="end"/.test(svgs(arPage.t)[0]), () => 'W-10. an Arabic plan\'s picture is right to left (titles from the right, "معاينة")');

    // ---------- W-11: the same security with the pictures ----------
    chk(() => [page, twoPage, arPage].every((x) => x.h['content-security-policy'] === "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" && !/<script|<img\b|<iframe|<object|<embed|\shref="|\ssrc="/i.test(x.t)), () => 'W-11. the window\'s policy is unchanged, and the page has no script, image, frame or link');
    const twoState = await s.call('approve_plan', { planId: two.j.plan.planId });
    chk(() => !twoState.err && twoState.j.status === 'waiting', () => `W-11. opening the page with its pictures approves nothing: ${short(twoState)}`);

    // ---------- W-06: reopen ----------
    const t2 = await s.call('generate_theme', { brand: '#123456', name: 'Reopen Theme' }), rid = t2.j.plan.planId;
    await s.call('approve_plan', { planId: rid }); await linkAt(4); const n1 = links().length;
    const re = await s.call('approve_plan', { planId: rid, reopen: true }); await linkAt(n1); const all = links();
    chk(() => !re.err && re.j.status === 'waiting' && re.j.window === 'opened again' && all.length === n1 + 1 && all[all.length - 1] === all[all.length - 2], () => `W-06. reopen opens the same link again: ${short(re)} ${all.slice(-2).join(' ')}`);
  } finally { await s.close(); }

  // ---------- W-07: an expired plan's link ----------
  {
    const e = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '0', DATAARCUS_PLAN_TTL_MS: '1500' });
    try {
      const t = await e.call('generate_theme', { brand: '#0F766E', name: 'Old Theme' }), id = t.j.plan.planId, n = links().length;
      await e.call('approve_plan', { planId: id }); const l = await linkAt(n);
      await sleep(1700);
      const late = await req(l, { method: 'POST', origin: new URL(l).origin, body: 'decision=approve' });
      const ap = await e.call('approve_plan', { planId: id });
      chk(() => late.code === 404 && /no longer valid/.test(late.t) && ap.err && /expired/.test(ap.t), () => `W-07. an expired plan's link approves nothing: ${late.code} ${short(ap)}`);
    } finally { await e.close(); }
  }

  // ---------- W-08: no browser ----------
  {
    const b = await serverClient(ROOT, { DATAARCUS_BROWSER: path.join(ROOT, 'no-such-browser'), DATAARCUS_APPROVAL_WAIT_MS: '0' });
    try {
      const t = await b.call('generate_theme', { brand: '#0F766E', name: 'No Browser' }), id = t.j.plan.planId;
      const ap = await b.call('approve_plan', { planId: id });
      const w = await b.call('generate_theme', { brand: '#0F766E', name: 'No Browser', planId: id });
      chk(() => ap.err && /could not open its approval window/.test(ap.t) && w.err && /not approved yet/.test(w.t), () => `W-08. a browser that can't start: refused, said so, nothing approved: ${short(ap)}`);
    } finally { await b.close(); }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-aw-')), problems = []; let checks = 0;
  await approvalWindow({ check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  approval window  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  approval window  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
