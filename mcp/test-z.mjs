// The outside review of the 0.2.9 release candidate (fix/0.2.9-gate 22c81fe), the tools layer's holes Z-01, Z-02,
// Z-03, Z-04, Z-06, Z-07, written red first. test.mjs runs it with its own client (import { zgate }); alone:
//   node test-z.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let fresh = 0;
// a fresh copy of a module (its own plan store, its own TTL read from the environment at import)
const freshImport = (rel) => import(pathToFileURL(path.join(HERE, rel)).href + '?z=' + (++fresh));

export async function zgate({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
  fs.mkdirSync(path.join(ROOT, 'zg', 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'zg', 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' }],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } }));
  const all = () => tree(ROOT).sort().join('|');

  // ---------- Z-01: a plan kind that allows a tool but pins nothing for it fails closed; a report plan writes no theme file ----------
  {
    const pl = await call('plan_layout', { path: 'zg', layout: 'exec' }), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    await call('approve_plan', { planId: pid, userReply: 'go' });
    const before = all(), t = await call('generate_theme', { brand: '#B91C1C', name: 'Any Inputs', folder: 'zg', planId: pid });
    chk(() => t.err && /Nothing was written/.test(t.t) && all() === before, () => `Z-01. a report plan writes no theme file (any inputs): ${short(t)}`);
    const np = await call('plan_layout', { layout: 'exec' });
    chk(() => !np.err && !(np.j.plan && np.j.plan.planId) && /generate_theme/.test(JSON.stringify(np.j.plan || np.j.noPlan || '')), () => `Z-01. plan_layout without the model gives no plan id and says how to get a theme file: ${short(np)}`);
    const P = await freshImport('lib/plans.mjs');
    const id = P.propose('theme', null, ['a theme file']); P.approve(id, 'go');
    let err = ''; try { P.gate('generate_theme', id, null, { brand: '#000000' }); } catch (e) { err = e.message; }
    chk(() => /Nothing was written/.test(err) && /pin/i.test(err), () => `Z-01. a plan with no pinned inputs for the tool is refused (fails closed): ${err}`);
    const tid = P.propose('twin', 'm', ['a twin'], { labels: {} }); P.approve(tid, 'go');
    let terr = ''; try { P.gate('create_arabic_twin', tid, 'm'); } catch (e) { terr = e.message; }
    chk(() => terr === '', () => `Z-01. the twin (its write uses only the plan's data) still passes: ${terr}`);
  }

  // ---------- Z-02: (a) a reply with any no/not/wait word is never a go; (b) approved once, and the life counts from the proposal ----------
  {
    const P = await freshImport('lib/plans.mjs');
    const go = ['go', 'Go ahead', 'yes', 'yes, build it', 'OK', 'okay, go', 'approved', 'proceed', 'sure', 'No problem, go ahead', 'Yes please go', 'موافق', 'نعم', 'تمام', 'ابدأ', 'نعم، اكتب التقرير'];
    const no = ['no', 'I said no', "Wait, don't go yet", 'not yet', 'stop', 'hold on', 'cancel it', 'go later', 'yes but not now', "don't go", 'do not go', 'go? no', 'hmm', 'لا', 'لا تكتب', 'انتظر', 'توقف', 'ليس الآن', 'مش دلوقتي', 'مو الحين', 'نعم لكن انتظر', 'لا، ابدأ لاحقا'];
    const wrong = [];
    for (const r of go) { const id = P.propose('theme', null, ['x']); try { P.approve(id, r); } catch (e) { wrong.push('refused: ' + r); } }
    for (const r of no) { const id = P.propose('theme', null, ['x']); try { P.approve(id, r); wrong.push('approved: ' + r); } catch (e) { if (!/does not say go/.test(e.message)) wrong.push('other message: ' + r); } }
    chk(() => !wrong.length && go.length + no.length >= 20, () => `Z-02a. replies (${go.length} go, ${no.length} not): ${wrong.join('; ')}`);
    const id = P.propose('theme', null, ['x']); P.approve(id, 'go');
    let again = ''; try { P.approve(id, 'go'); } catch (e) { again = e.message; }
    chk(() => /already approved/.test(again), () => `Z-02b. a second approval is refused: ${again}`);
    process.env.DATAARCUS_PLAN_TTL_MS = '400';
    const S = await freshImport('lib/plans.mjs');
    delete process.env.DATAARCUS_PLAN_TTL_MS;
    const sid = S.propose('theme', null, ['x'], { pins: { generate_theme: {} } });
    await new Promise((r) => setTimeout(r, 250)); S.approve(sid, 'go');
    await new Promise((r) => setTimeout(r, 250));
    let exp = ''; try { S.gate('generate_theme', sid, null, {}); } catch (e) { exp = e.message; }
    chk(() => /expired/.test(exp), () => `Z-02b. a plan's life counts from its proposal, never extended by the approval: ${exp || 'still alive'}`);
  }

  // ---------- Z-06: control characters (C0, C1) as code points too, not only format characters ----------
  {
    const A = await freshImport('lib/answer.mjs');
    const raw = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/;
    const samples = ['a\u0000b', 'a\u0085b', 'x\u009B[2J', '⁦isolate⁩', 'zero​width'];
    const outs = samples.map(A.nameOut), keyed = JSON.stringify(A.out({ '\u0085': 1, k: ['\u009b'] }));
    chk(() => outs.every((s) => !raw.test(s)) && !raw.test(keyed) && A.nameOut('a\tb\nc\rd') === 'a\tb\nc\rd', () => `Z-06. raw control or format characters left: ${JSON.stringify(outs)} ${keyed}`);
  }

  // ---------- Z-07: whatever its shape, no answer passes the cap ----------
  {
    const A = await freshImport('lib/answer.mjs');
    const size = (x) => JSON.stringify(x).length, s399 = 'x'.repeat(399);
    const keys = Object.fromEntries(Array.from({ length: 12000 }, (_, i) => ['k' + i, 1]));
    let deep = { leaf: Object.fromEntries(Array.from({ length: 6000 }, (_, i) => ['d' + i, i])) }; for (let i = 0; i < 200; i++) deep = { n: deep };
    const strs = Object.fromEntries(Array.from({ length: 300 }, (_, i) => ['s' + i, s399]));
    const mixed = { a: keys, b: [strs, strs], c: 'y'.repeat(399) };
    const bad = [['keys', keys], ['deep', deep], ['399-character strings', strs], ['mixed', mixed]].map(([n, o]) => { let r; try { r = A.capAnswer(o, size); } catch (e) { return n + ' threw ' + e.message; } return size(r) <= A.ANSWER_MAX && r.truncated ? null : `${n}: ${size(r)}`; }).filter(Boolean);
    chk(() => !bad.length, () => `Z-07. answers over the cap or not marked: ${bad.join('; ')}`);
  }

  // ---------- Z-03: a user file is read from one descriptor, never through a link; PRIVACY says what this can't prevent ----------
  {
    fs.writeFileSync(path.join(ROOT, 'zg', 'real-theme.json'), JSON.stringify({ name: 'x', dataColors: ['#112233'] }));
    try { fs.symlinkSync(path.join(ROOT, 'zg', 'real-theme.json'), path.join(ROOT, 'zg', 'link-theme.json')); } catch (e) { /* no links here */ }
    const pl = await call('plan_layout', { path: 'zg', name: 'Z link theme', theme: 'zg/link-theme.json', noDataMessage: false, pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }] }] }), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    await call('approve_plan', { planId: pid, userReply: 'go' });
    const x = await call('create_report', { path: 'zg', name: 'Z link theme', planId: pid, theme: 'zg/link-theme.json', noDataMessage: false, pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }] }] });
    chk(() => x.err && /link/.test(x.t) && /Nothing was written/.test(x.t), () => `Z-03. a theme behind a link is refused: ${short(x)}`);
    const files = fs.readFileSync(path.join(HERE, 'lib/files.mjs'), 'utf8');
    chk(() => /readCapped/.test(files) && !/readFileSync\(full\)/.test(files), () => 'Z-03. readUserFile reads through readCapped (one descriptor), never by name after a check');
    const privacy = fs.readFileSync(path.join(HERE, 'PRIVACY.md'), 'utf8');
    chk(() => /another program on the same computer/i.test(privacy), () => 'Z-03. PRIVACY says plainly what the folder checks can\'t prevent');
  }

  // ---------- Z-04: a rollback removes only what this call created; anything else is left and named ----------
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-z4-'));
    const script = `
      const { writeTree } = await import(${JSON.stringify(pathToFileURL(path.join(HERE, 'lib/files.mjs')).href)});
      const fs = await import('node:fs'); const path = await import('node:path');
      let msg = '';
      try { writeTree(process.env.DATAARCUS_ROOT, [{ path: 'Z.Report/definition/a.json', data: '{}' }, { path: 'Z.pbip', data: '{}' }],
        { beforePlace: (t) => { if (t === 'Z.pbip') { fs.writeFileSync(path.join(process.env.DATAARCUS_ROOT, 'Z.Report', 'someone-else.txt'), 'theirs'); throw new Error('simulated failure'); } } }); }
      catch (e) { msg = e.message; }
      const left = fs.existsSync(path.join(process.env.DATAARCUS_ROOT, 'Z.Report', 'someone-else.txt')), ours = fs.existsSync(path.join(process.env.DATAARCUS_ROOT, 'Z.Report', 'definition', 'a.json'));
      console.log(JSON.stringify({ msg, left, ours, pbip: fs.existsSync(path.join(process.env.DATAARCUS_ROOT, 'Z.pbip')) }));`;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, DATAARCUS_ROOT: dir }, encoding: 'utf8' });
    let o = {}; try { o = JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { o = { err: r.stderr.slice(0, 300) }; }
    chk(() => o.left === true && o.ours === false && o.pbip === false && /Nothing was written|not removed/.test(o.msg) && /someone-else\.txt/.test(o.msg), () => `Z-04. the rollback keeps a file it did not create and names it: ${JSON.stringify(o)}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-z-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await zgate({ call: s.call, check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  zgate  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  zgate  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
