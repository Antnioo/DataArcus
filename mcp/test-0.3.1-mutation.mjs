// T1 (0.3.1, wave 6; the owner, 25 Oct, after an outside review: "prioritise confidence in critical invariants over
// more checks"): a mutation suite. It proves the existing tests catch a broken invariant. For each mutant: a COPY of
// mcp/ (its node_modules linked), assets/js, assets/data, scripts/tests and scripts/gulf-calendar in a temp folder, one small change to one source file of
// the copy (it must match exactly once and still parse), then the existing suites that guard it, run in the copy; at
// least one must fail ("killed"). The repo's own files are never edited. Plan, mutants and results: mcp/work/T1.md.
// Why a copied tree: the suites find the server and lib/ from their own folder (import.meta.url), so a copy runs them
// unchanged against the mutant, with no test-only hook in product code.
//   node test-0.3.1-mutation.mjs                    every mutant, each until its first failing guard
//   DA_MUTATION_ALL=1 node test-0.3.1-mutation.mjs  every guard of every mutant (the results table in T1.md)
//   DA_MUTATION_ONLY=G-used,W-wx node ...           some mutants
//   DA_MUTATION_EXTRA=test-z.mjs,test-r.mjs node ... more guards for every mutant (to find what kills a survivor)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const T0 = Date.now(), ALL = !!process.env.DA_MUTATION_ALL;
const ONLY = new Set(String(process.env.DA_MUTATION_ONLY || '').split(',').map((s) => s.trim()).filter(Boolean));
const WORKERS = Math.max(1, Math.min(4, os.cpus().length));
const GUARD_TIMEOUT = 240000;   // (a guard that times out kills nothing: a hang is not a failing check)

// ---------- the mutants: { id, file (from the repo root), edits: [[exactly this, becomes this], ...], guards, only?, equivalent? } ----------
// equivalent: a mutant no test can kill without a hook in product code, with why; listed, not run (T1.md)
// guards: the existing suites (mcp/), the first expected to kill first. only: the platforms where the mutant means
// something (NFC/NFD: macOS keeps one folder for both forms, so normalising changes nothing there).
const PL = 'mcp/lib/plans.mjs', MO = 'mcp/lib/model.mjs', WI = 'mcp/lib/write-io.mjs', FI = 'mcp/lib/files.mjs', CR = 'mcp/lib/check-report.mjs', AW = 'mcp/lib/approval-window.mjs';
const MUTANTS = [
  // 1. the approval gate
  { id: 'G-unapproved', file: PL, edits: [["if (p.status !== 'approved') throw new Error(`Nothing was written: plan", "if (false) throw new Error(`Nothing was written: plan"]], guards: ['test-0.2.9.mjs', 'test-z.mjs', 'test-approval-hardening.mjs', 'test-audit6.mjs'] },
  { id: 'G-tool', file: PL, edits: [['if (!ALLOWS[p.kind].includes(tool)) throw', 'if (false) throw']], guards: ['test-0.2.9.mjs', 'test-z.mjs', 'test-r.mjs', 'test-approval-hardening.mjs', 'test-audit6.mjs'] },
  { id: 'G-used', file: PL, edits: [['if (p.used && p.used[tool]) throw', 'if (false) throw']], guards: ['test-partial-writes.mjs', 'test-0.3.0-write-safety.mjs', 'test-z.mjs'] },
  { id: 'G-consume', file: PL, edits: [['p.used = p.used || {}; p.used[tool] = true;', 'p.used = p.used || {};']], guards: ['test-partial-writes.mjs', 'test-0.3.0-write-safety.mjs', 'test-z.mjs'] },
  { id: 'G-inputs', file: PL, edits: [["if (off.length) throw new Error(`Nothing was written: ${tool}'s inputs differ", "if (false) throw new Error(`Nothing was written: ${tool}'s inputs differ"]], guards: ['test-r.mjs', 'test-approval-hardening.mjs', 'test-z.mjs', 'test-audit6.mjs'] },
  { id: 'G-nopin', file: PL, edits: [['if (want && pin === undefined) throw', 'if (false) throw']], guards: ['test-r.mjs', 'test-z.mjs', 'test-approval-hardening.mjs'] },
  { id: 'G-nopins', file: PL, edits: [["if (!want && tool !== 'create_arabic_twin') throw", 'if (false) throw']], guards: ['test-z.mjs', 'test-r.mjs', 'test-approval-hardening.mjs'] },
  { id: 'G-print', file: PL, edits: [['if (p.modelPrint && print && print !== p.modelPrint) throw', 'if (false) throw']], guards: ['test-0.3.0-approval-complete.mjs', 'test-approval-hardening.mjs', 'test-0.3.0-approval-disclosure.mjs'] },
  { id: 'G-noprint', file: PL, edits: [["if (p.modelPrint && !print && tool !== 'create_arabic_twin') throw", 'if (false) throw']], guards: ['test-z.mjs', 'test-approval-hardening.mjs', 'test-r.mjs'] },
  { id: 'G-model', file: PL, edits: [['if (p.model && model && p.model !== model) throw', 'if (false) throw']], guards: ['test-0.2.9.mjs', 'test-z.mjs', 'test-r.mjs', 'test-approval-hardening.mjs', 'test-audit6.mjs'] },
  { id: 'G-expired', file: PL, edits: [['const alive = (p) => p && now() - p.created <= TTL;', 'const alive = (p) => !!p;']], guards: ['test-z.mjs', 'test-approval.mjs', 'test-0.2.9.mjs'] },
  { id: 'G-ttl-longer', file: PL, edits: [['? Math.min(TTL_DEFAULT, v) : TTL_DEFAULT', '? v : TTL_DEFAULT']], guards: ['test-0.2.9.mjs', 'test-z.mjs', 'test-approval.mjs'] },
  { id: 'G-who', file: PL, edits: [["if (by !== 'user-in-browser' && by !== 'user-in-app') throw", 'if (false) throw']], guards: ['test-audit6.mjs', 'test-z.mjs', 'test-approval.mjs'] },
  { id: 'G-refused', file: PL, edits: [["if (p.status === 'refused') throw new Error(REFUSED(p).replace(", 'if (false) throw new Error(REFUSED(p).replace(']], guards: ['test-z.mjs', 'test-rc23.mjs', 'test-rc22.mjs', 'test-approval.mjs'] },
  // an approval living past the server process: saved next to the module at each approval, read back when it loads
  { id: 'G-persist', file: PL, edits: [
    ['const plans = new Map();', "const plans = new Map(); const KEEP_F = new URL('./.mutant-plans.json', import.meta.url), KEEP_FS = await import('node:fs'); try { for (const [k, v] of JSON.parse(KEEP_FS.readFileSync(KEEP_F, 'utf8'))) plans.set(k, v); } catch (e) { /* none yet */ } const keepPlans = () => KEEP_FS.writeFileSync(KEEP_F, JSON.stringify([...plans]));"],
    ["p.status = 'approved'; p.approvedAt = now(); p.approvedBy = by;", "p.status = 'approved'; p.approvedAt = now(); p.approvedBy = by; keepPlans();"]
  ], guards: ['test-z.mjs', 'test-approval-hardening.mjs', 'test-r.mjs'] },
  { id: 'G-artifact', equivalent: "no tool reaches it: the artifact is kept in this process only and its id is random, so it can't differ from the approved one unless the server's own code changes it; the gate's binding (G-binding) is what a tool can reach", file: 'mcp/tools/create_report.mjs', edits: [['if (digestOf(art.files) !== art.digest || bindingOf(art.digest, art.pin, art.modelPrint) !== Plans.approvedBinding(a.planId)) throw', 'if (false) throw']], guards: ['test-j14-exact.mjs'] },
  { id: 'G-binding', file: PL, edits: [['const art = artifacts.get(p.id); if (art) p.approvedBinding = art.binding;', 'const art = artifacts.get(p.id);']], guards: ['test-r.mjs', 'test-j14-exact.mjs', 'test-z.mjs'] },
  // (0.3.1 K2) the twin's write: the kept files' digest and the rebuild's, compared with the approved one
  { id: 'K-twin-digest', file: 'mcp/lib/twin-write.mjs', edits: [['if (digestOf(art.files) !== art.digest || twinTree(P).digest !== art.digest) throw', 'if (false) throw']], guards: ['test-0.3.1-twin-artifact.mjs'] },
  // (0.3.1 AF2, the release audit) the native copy writes its plan's files or nothing; a plan's file name, never another; check_model_health's last model check
  { id: 'AF-copy-digest', file: 'mcp/lib/native-copy.mjs', edits: [['if (digestOf(art.files) !== art.digest || T.digest !== art.digest) throw', 'if (false) throw']], guards: ['test-0.3.1-audit-writes.mjs'] },
  { id: 'AF-taken-name', file: 'mcp/lib/fix-scripts.mjs', edits: [['  if (taken) throw taken;\n', '  if (taken) return f;\n']], guards: ['test-0.3.1-audit-writes.mjs'] },
  { id: 'AF-health-model', file: 'mcp/tools/check_model_health.mjs', edits: [['    if (write) sameModelBeforeWrite(planId, () => loadModel(p).print, print0);\n', '']], guards: ['test-0.3.1-audit-writes.mjs'] },

  // 2. path safety
  { id: 'D-within', file: MO, edits: [["const within = (root, p) => { const rel = path.relative(root, p); return !(rel.startsWith('..') || path.isAbsolute(rel)); };", 'const within = (root, p) => { const rel = path.relative(root, p); return !path.isAbsolute(rel); };']], guards: ['test-0.2.9d.mjs', 'test-platform-paths.mjs', 'test-audit6.mjs', 'test-0.3.0-write-safety.mjs'] },
  { id: 'D-underRoot-any', file: MO, edits: [['  return r && within(realRoot, r) ? path.join(root, path.relative(realRoot, r)) : null;', '  return full;']], guards: ['test-platform-paths.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs', 'test-0.3.0-write-safety.mjs'] },
  { id: 'D-underRoot-nolink', file: MO, edits: [['  return r && within(realRoot, r) ? path.join(root, path.relative(realRoot, r)) : null;', '  return null;']], guards: ['test-platform-paths.mjs'] },
  { id: 'D-real', file: MO, edits: [['  if (!r || !within(fs.realpathSync.native(ROOT), r)) throw linkError(', '  if (false) throw linkError(']], guards: ['test-platform-paths.mjs', 'test-0.3.0-write-safety.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs', 'test-z.mjs'] },
  { id: 'D-realIn', file: MO, edits: [['const realIn = (full, shown) => { const r = realOf(full); if (!r || !within(fs.realpathSync.native(root), r)) throw', 'const realIn = (full, shown) => { const r = realOf(full); if (false) throw']], guards: ['test-0.2.9d.mjs', 'test-audit6.mjs', 'test-platform-paths.mjs'] },
  { id: 'D-dangling', file: MO, edits: [['    if (isLink(cur)) return null;\n', '']], guards: ['test-platform-paths.mjs', 'test-0.2.9d.mjs', 'test-0.3.0-write-safety.mjs', 'test-audit6.mjs', 'test-z.mjs'] },
  { id: 'D-inside', file: MO, edits: [['  const full = underRoot(ROOT, p);\n  if (full == null)', "  const full = path.resolve(ROOT, String(p || '.'));\n  if (full == null)"]], guards: ['test-platform-paths.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs', 'test-0.3.0-write-safety.mjs'] },
  { id: 'D-nfc', file: MO, edits: [["  const full = path.resolve(root, String(p || '.'));\n  if (within(root, full)) return full;", "  const full = path.resolve(root, String(p || '.').normalize('NFC'));\n  if (within(root, full)) return full;"]], guards: ['test-platform-paths.mjs'], only: ['linux', 'win32'] },
  { id: 'D-nfd', file: MO, edits: [["  const full = path.resolve(root, String(p || '.'));\n  if (within(root, full)) return full;", "  const full = path.resolve(root, String(p || '.').normalize('NFD'));\n  if (within(root, full)) return full;"]], guards: ['test-platform-paths.mjs'], only: ['linux', 'win32'] },
  // (AF1) the report reader opens a file through a linked folder: diskSource's check of every folder on the way skipped
  { id: 'R-ancestors', file: 'mcp/lib/read-report.mjs', edits: [['  const at = (rel) => {\n    const parts', "  const at = (rel) => { return path.join(loc.reportDir, ...String(rel).split('/').filter(Boolean));\n    const parts"]], guards: ['test-0.3.1-audit-readers.mjs'] },
  // (SQ6) the reader: two models at one depth read silently as the first (SQ15a: the owner's yes); a .pbit link followed; a .pbit that changed while read used
  // (SQ15a) a KPI's target expression returned as text; an image file name returned unscreened
  { id: 'R-kpi-quoted', file: MO, edits: [["target: !k ? 'none' : k.expression ? 'an expression' :", "target: !k ? 'none' : k.expression ? String(x.kpi.targetExpression) :"]], guards: ['test-0.3.1-sq15a.mjs'] },
  { id: 'R-image-screen', file: 'mcp/lib/read-report.mjs', edits: [['x.images = imgs.map(safeName);', 'x.images = imgs;']], guards: ['test-0.3.1-sq15a.mjs'] },
  { id: 'R-model-tie', file: MO, edits: [['  if (tied.length > 1) {', '  if (false) {']], guards: ['test-0.3.1-reader-seen.mjs'] },
  { id: 'R-pbit-link', file: MO, edits: [["  if (isLink(f)) throw linkRefused('file');\n  let fd;\n  try { fd = fs.openSync(f, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0)); } catch (e) { if (e.code === 'ELOOP') throw linkRefused('file'); throw e; }", "  let fd = fs.openSync(f, 'r');"]], guards: ['test-0.3.1-reader-seen.mjs'], only: ['linux', 'darwin'] },
  { id: 'R-pbit-changed', file: MO, edits: [['if (n !== size0 || st.size !== size0 || after.size !== st.size || after.mtimeMs !== st.mtimeMs) throw changedWhileRead();', 'if (false) throw changedWhileRead();']], guards: ['test-0.3.1-reader-seen.mjs'] },

  // 3. writes and their clean-up
  { id: 'W-wx', file: WI, edits: [["const NEW_FILE = { flag: 'wx' };", "const NEW_FILE = { flag: 'w' };"]], guards: ['test-0.3.0-write-safety.mjs', 'test-partial-writes.mjs', 'test-z.mjs'] },
  { id: 'W-tree-norollback', file: FI, edits: [['    const { ours, foreign } = rollBack(made);\n    if (placed)', '    const { ours, foreign } = { ours: [], foreign: [] };\n    if (placed)']], guards: ['test-partial-writes.mjs', 'test-0.3.0-write-safety.mjs', 'test-z.mjs'] },
  { id: 'W-new-norollback', file: WI, edits: [['    const { ours, foreign } = rollBack(made);\n    dirs.forEach', '    const { ours, foreign } = { ours: [], foreign: [] };\n    dirs.forEach']], guards: ['test-partial-writes.mjs', 'test-0.3.0-write-safety.mjs', 'test-0.3.0-answers-safety.mjs'] },
  { id: 'W-identity', file: WI, edits: [['if (!e.id || st.dev !== e.id.dev || st.ino !== e.id.ino || st.isSymbolicLink()', 'if (st.isSymbolicLink()']], guards: ['test-0.3.0-write-safety.mjs', 'test-partial-writes.mjs'] },
  { id: 'W-via', file: WI, edits: [['  for (const v of e.via || []) {', '  for (const v of []) {']], guards: ['test-0.3.0-write-safety.mjs', 'test-partial-writes.mjs'] },
  { id: 'W-size', equivalent: "since RB (0.3.1) a file is removed only while its content has the sha256 of the bytes this call wrote, read through a handle whose size is compared too: a file of another size never passes, so dropping this size check changes nothing (S2c still pins the behaviour)", file: WI, edits: [[' || (e.size != null && st.size !== e.size)) return', ') return']], guards: ['test-0.3.0-write-safety.mjs', 'test-partial-writes.mjs'] },
  { id: 'W-hash', file: WI, edits: [["  if (!e.dir && !sameBytes(e)) return 'changed';", "  if (false) return 'changed';"]], guards: ['test-0.3.0-write-safety.mjs', 'test-partial-writes.mjs'] },
  { id: 'W-root', file: WI, edits: [['  const root = rootReal(); if (root && !within(', '  const root = null; if (root && !within(']], guards: ['test-0.3.0-write-safety.mjs', 'test-partial-writes.mjs'] },
  { id: 'W-tree-real', file: FI, edits: [['  real(dir);\n  tops.forEach((t) => real(path.join(dir, t)));\n', '']], guards: ['test-0.3.0-write-safety.mjs', 'test-z.mjs', 'test-audit6.mjs', 'test-partial-writes.mjs'] },
  { id: 'W-free-real', equivalent: "only a race reaches it: freeFile's folder was checked by inside() before its mkdirs and every folder made is this call's own; a link put there in between needs another program at that instant, which no test can time without a hook in product code", file: FI, edits: [['    real(dir);   // (still inside', '    // (still inside']], guards: ['test-0.3.0-write-safety.mjs', 'test-audit6.mjs', 'test-partial-writes.mjs'] },
  { id: 'W-nothingAt', file: MO, edits: [['export const nothingAt = (f) => { try { fs.lstatSync(f); return false; }', 'export const nothingAt = (f) => { try { fs.statSync(f); return false; }']], guards: ['test-0.3.0-write-safety.mjs', 'test-audit6.mjs', 'test-z.mjs', 'test-0.2.9d.mjs'] },
  { id: 'W-taken', file: FI, edits: [['  if (taken.length) throw new Error(`Nothing was written: ${taken.length === 1', '  if (false) throw new Error(`Nothing was written: ${taken.length === 1']], guards: ['test-0.3.0-write-safety.mjs', 'test-z.mjs', 'test-audit6.mjs', 'test-partial-writes.mjs'] },
  { id: 'W-answers-identity', file: 'mcp/lib/answers.mjs', edits: [['const same = (a, b) => !!a && !!b && a.dev === b.dev && a.ino === b.ino && a.size', 'const same = (a, b) => !!a && !!b && a.size']], guards: ['test-0.3.0-answers-safety.mjs', 'test-confirm-memory.mjs'] },

  // 4. the privacy promise: the instruction screen, and no data value in an answer
  { id: 'S-ignore', file: MO, edits: [["  [/\\b(ignore|disregard|forget|override)\\b[^.]{0,40}\\b(rules?|instructions?|prompt|above|previous)\\b/i, 'asks to ignore instructions'],\n", '']], guards: ['test-audit-oct.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs'] },
  { id: 'S-arabic-ignore', file: MO, edits: [["  [/(تجاهل|تجاهلي|تجاهلوا|انس|انسى|اترك)\\s+((كل|جميع)\\s+)?(ال)?(تعليمات|اوامر|قواعد)/, 'asks to ignore instructions'],\n", '']], guards: ['test-audit-oct.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs'] },
  { id: 'S-tool', file: MO, edits: [["  [new RegExp(`\\\\b(${TOOL_NAMES.join('|')})\\\\b`, 'i'), 'names a DataArcus tool'],\n", '']], guards: ['test-audit-oct.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs'] },
  { id: 'S-approval', file: MO, edits: [["'claims an approval'],\n  [/\\[\\s*(user|system|assistant)", "'claims an approval'].slice(0, 0).concat([/(?!)/, 'claims an approval']),\n  [/\\[\\s*(user|system|assistant)"]], guards: ['test-audit-oct.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs'] },
  { id: 'S-data', file: MO, edits: [["|\\bsend\\b[^.]{0,30}\\b(rows?|data|values?)\\b[^.]{0,20}\\bto\\b/i, 'asks for data values'],", "|\\bsend\\b[^.]{0,30}\\b(rows?|data|values?)\\b[^.]{0,20}\\bto\\b/i, 'asks for data values'].slice(0, 0).concat([/(?!)/, 'asks for data values']),"]], guards: ['test-audit-oct.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs'] },
  { id: 'S-path', file: MO, edits: [["  [/(^|[\\s\"'(])\\.\\.[\\\\/]|\\b[a-z]:\\\\|(^|\\s)~[\\\\/]|^\\\\\\\\|\\s\\\\\\\\[a-z0-9]|", "  [/(^|[\\s\"'(])\\.\\.[\\\\/]|(^|\\s)~[\\\\/]|"]], guards: ['test-audit-oct.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs'] },
  { id: 'S-nfkc', file: MO, edits: [["const plainArabic = (s) => String(s).normalize('NFKC').replace(/[\\p{Cf}\\p{Cc}]/gu, '')", 'const plainArabic = (s) => String(s)']], guards: ['test-audit6.mjs', 'test-audit-oct.mjs', 'test-0.2.9d.mjs'] },
  { id: 'S-lookalike', file: MO, edits: [["  .replace(/[\\u0370-\\u03FF\\u0400-\\u04FF\\u0500-\\u052F]/g, (ch) => LOOKALIKE[ch] || ch)", '  ']], guards: ['test-audit-oct.mjs', 'test-audit6.mjs', 'test-0.2.9d.mjs'] },
  { id: 'S-shown', file: MO, edits: [['export const shownName = (s, cap = 60) => { if (readsLikeInstruction(s)) return WITHHELD;', 'export const shownName = (s, cap = 60) => {']], guards: ['test-0.2.9d.mjs', 'test-audit6.mjs', 'test-audit-oct.mjs'] },
  { id: 'S-suspicious', file: MO, edits: [['readsLikeInstruction(t.name) ? { suspicious: true } : {}', '{}']], guards: ['test-0.2.9f.mjs', 'test-0.2.9d.mjs', 'test-audit6.mjs', 'test-audit-oct.mjs'] },
  { id: 'S-nameOut', file: 'mcp/lib/answer.mjs', edits: [['export const nameOut = (s) => (FORMAT.test(String(s)) ?', 'export const nameOut = (s) => (false ?']], guards: ['test-audit6.mjs', 'test-z.mjs', 'test-0.2.9d.mjs'] },
  { id: 'V-rows', file: MO, edits: [['    hiddenColumns: t.columns.filter((c) => c.isHidden).length,', '    hiddenColumns: t.columns.filter((c) => c.isHidden).length, source: JSON.stringify((((modelOf(m.tmsl).tables || []).find((x) => x.name === t.name) || {}).partitions || []).map((x) => x.source || null)),']], guards: ['test-0.2.9d.mjs', 'test-0.3.0-large-model-caps.mjs', 'test-audit6.mjs', 'test-models/golden-baseline.mjs'] },
  { id: 'V-title', file: 'mcp/lib/redesign.mjs', edits: [['const shown = { visual: safeName(v.id),', 'const shown = { title: JSON.stringify(((v.json.visual || {}).visualContainerObjects || {}).title || null), visual: safeName(v.id),']], guards: ['test-0.3.0-approval-disclosure.mjs', 'test-0.3-redesign.mjs'] },
  // (0.3.1 CS1) the consistent copy removes a visual's own text settings only: one more pointer kind in the allowlist (any visual object) must be refused
  { id: 'CS-allow', file: 'mcp/lib/redesign.mjs', edits: [[String.raw`/^\/visual\/visualContainerObjects\/title\/\d+\/properties\/text\/expr\/Literal\/Value$/, TEXT_POINTER],`, String.raw`/^\/visual\/visualContainerObjects\/title\/\d+\/properties\/text\/expr\/Literal\/Value$/, TEXT_POINTER, /^\/visual\/objects\//],`]], guards: ['test-0.3.1-cs1.mjs'] },
  // (0.3.1 CS2) the theme pointers a consistent copy may set are a role's font and size only: any visual style property (a colour, a background) must be refused
  { id: 'CS-style', file: 'mcp/lib/text-format.mjs', edits: [['/(?:${[r.props.family, r.props.size].join(\'|\')})`).join(\'|\')})$`);', '/[A-Za-z]+`).join(\'|\')})$`);']], guards: ['test-0.3.1-cs2.mjs'] },

  // 5. check_report: "can break" versus a note
  { id: 'C-schema', file: CR, edits: [["  if (f.origin === 'schema') return 'canBreak';", "  if (f.origin === 'schema') return 'dataarcusRule';"]], guards: ['test-0.2.9-checks.mjs', 'test-0.2.9-a4.mjs', 'test-0.3.0-check.mjs'] },
  { id: 'C-desktopOpens', file: CR, edits: [['  PBIR_THEME_FILE_NAME_MISMATCH: () => true,\n', '']], guards: ['test-0.2.9-a4.mjs', 'test-0.2.9-checks.mjs', 'test-0.3.0-check.mjs'] },
  { id: 'C-known', file: CR, edits: [["if (f.known) return 'desktopOpens'; const t = DESKTOP_OPENS", 'const t = DESKTOP_OPENS']], guards: ['test-0.3.1-validator-gap.mjs', 'test-0.2.9-a4.mjs', 'test-0.2.9-checks.mjs', 'test-0.3.0-check.mjs'] },
  // (0.3.1 P3A) the two validator warnings Desktop was measured to draw: back to "can break"
  { id: 'C-maylook', file: CR, edits: [["if (f.severity === 'warning' && Object.hasOwn(DESKTOP_DRAWS, f.rule)) return 'mayLook'; ", '']], guards: ['test-0.3.1-p3a.mjs'] },
  { id: 'C-image', file: CR, edits: [["rule: 'IMAGE_MEASURE_PENDING', severity: 'note'", "rule: 'IMAGE_MEASURE_PENDING', severity: 'error'"]], guards: ['test-0.3.0-flip-cards.mjs', 'test-0.3.1-dax-functions.mjs'] },
  { id: 'C-icon', file: CR, edits: [["rule: 'ICON_MEASURE_PENDING', severity: 'note'", "rule: 'ICON_MEASURE_PENDING', severity: 'error'"]], guards: ['test-0.3.0-theme-icons.mjs', 'test-0.3.0-flip-cards.mjs'] },
  { id: 'C-dax', file: CR, edits: [["rule: 'DAX_MEASURE_PENDING', severity: 'note'", "rule: 'DAX_MEASURE_PENDING', severity: 'error'"]], guards: ['test-0.3.1-dax-functions.mjs'] },
  { id: 'C-instruction', file: CR, edits: [["rule: 'INSTRUCTION_TEXT', severity: 'note', file: `definition/pages/", "rule: 'INSTRUCTION_TEXT', severity: 'error', file: `definition/pages/"]], guards: ['test-0.3.1-checker.mjs', 'test-0.3.0-check.mjs', 'test-audit6.mjs'] },
  { id: 'C-validator-sev', file: CR, edits: [["severity: known ? 'note' : d.severity === 'error' ? 'error' :", "severity: known ? 'note' : d.severity === 'error' ? 'warning' :"]], guards: ['test-0.2.9-checks.mjs', 'test-0.3.0-check.mjs', 'test-0.2.9-a4.mjs'] },
  // 6. the approval page says what the click writes (SQ3): the writes in Arabic line for line and escaped, what was not
  // checked in the app's prompt, a pair's English page drawn in English
  { id: 'A-writesAr-match', file: AW, edits: [['Array.isArray(s.writesAr) && s.writesAr.length === w.plan.writes.length ?', 'Array.isArray(s.writesAr) ?']], guards: ['test-0.3.1-sq3.mjs'] },
  { id: 'A-writesAr-esc', file: AW, edits: [['<li dir="auto">${isoText(named(WA[i]), true)}<br>', '<li dir="auto">${named(WA[i])}<br>']], guards: ['test-0.3.1-sq3.mjs'] },
  { id: 'A-prompt-notChecked', file: AW, edits: [['  if (nc.length) lines.push(cut(`Not checked before writing:', '  if (false) lines.push(cut(`Not checked before writing:']], guards: ['test-0.3.1-sq3.mjs'] },
  { id: 'A-pair-lang', file: AW, edits: [["fig(PP[e], `${W.enPage} ${i + 1}`, 'en')", 'fig(PP[e], `${W.enPage} ${i + 1}`)']], guards: ['test-0.3.1-sq3.mjs'] },
  { id: 'C-fieldparam', file: CR, edits: [["rule: 'FIELD_PARAMETER_TITLE', severity: 'warning'", "rule: 'FIELD_PARAMETER_TITLE', severity: 'error'"]], guards: ['test-0.3.0-metric-switcher.mjs', 'test-0.3.0-check.mjs', 'test-0.3.1-checker.mjs'] }
];

// (0.3.1 T1, Windows) a mutant's text is written with "\n"; a Windows checkout has the files with CRLF, so each text is
// matched and written in its file's own line ending (12 mutants span a line break; on Windows none of them applied)
const eolOf = (text) => (/\r\n/.test(text) ? '\r\n' : '\n');
const inEol = (s, eol) => (eol === '\n' ? s : s.replace(/\r?\n/g, eol));
const countIn = (text, from) => text.split(inEol(from, eolOf(text))).length - 1;

// DA_MUTATION_DRY=1: only checks that every mutant's text is in its file exactly once (after code moves), runs nothing
if (process.env.DA_MUTATION_DRY) {
  const bad = MUTANTS.flatMap((m) => m.edits.map(([from]) => [m, from, fs.existsSync(path.join(REPO, m.file)) ? countIn(fs.readFileSync(path.join(REPO, m.file), 'utf8'), from) : -1]).filter(([, , n]) => n !== 1));
  bad.forEach(([m, from, n]) => console.log(`  - ${m.id}: ${n < 0 ? 'no file ' + m.file : `found ${n} times in ${m.file}`}: ${JSON.stringify(from.slice(0, 90))}`));
  console.log(`${bad.length ? 'FAIL' : 'PASS'}  mutation  ${MUTANTS.length} mutants checked, ${bad.length} not found once (dry run)`);
  process.exit(bad.length ? 1 : 0);
}

// ---------- the copies ----------
const problems = [], killed = [], lines = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) problems.push(msg); return cond; };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mutation-'));
const SKIP_DIRS = new Set(['node_modules', '.git']);   // (node_modules is linked, not copied)
function makeCopy(k) {
  const dst = path.join(TMP, 'w' + k);
  fs.cpSync(path.join(REPO, 'mcp'), path.join(dst, 'mcp'), { recursive: true, filter: (src) => !SKIP_DIRS.has(path.basename(src)) });
  fs.symlinkSync(path.join(REPO, 'mcp', 'node_modules'), path.join(dst, 'mcp', 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  for (const a of ['js', 'data']) fs.cpSync(path.join(REPO, 'assets', a), path.join(dst, 'assets', a), { recursive: true });
  // (the website's fixtures and report-check.mjs, which some suites read; RB: the Gulf calendar's test model, which the
  // golden baseline's task 11 reads: without it, its 6 differences in a copy, taken for load in T1)
  for (const s of ['tests', 'gulf-calendar']) fs.cpSync(path.join(REPO, 'scripts', s), path.join(dst, 'scripts', s), { recursive: true });
  return dst;
}
// the suites run as npm test runs them, with none of this run's own settings
const childEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(DATAARCUS_|DA_SHARD$|DA_MUTATION_|DA_PART_TIMES$)/.test(k)));
function runGuard(copy, guard) {
  return new Promise((resolve) => {
    // "test.mjs@3": one shard of test.mjs (DA_SHARD=3/4), as CI runs it
    const [file, shard] = guard.split('@'), env = Object.assign(childEnv(), shard ? { DA_SHARD: `${shard}/4` } : {});
    const t = Date.now(), child = spawn(process.execPath, [file], { cwd: path.join(copy, 'mcp'), env, stdio: ['ignore', 'pipe', 'pipe'] });
    let outText = '';
    child.stdout.on('data', (d) => { outText += d; if (outText.length > 200000) outText = outText.slice(-100000); });
    child.stderr.on('data', (d) => { outText += d; if (outText.length > 200000) outText = outText.slice(-100000); });
    const timer = setTimeout(() => { child.kill('SIGKILL'); }, GUARD_TIMEOUT);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const result = outText.trim().split('\n').filter((l) => /^(PASS|FAIL|SKIP) {2}/.test(l)).pop() || outText.trim().split('\n').pop() || '';
      resolve({ failed: signal !== 'SIGKILL' && (code !== 0 || /^FAIL/.test(result)), timedOut: signal === 'SIGKILL', result: result.slice(0, 160), seconds: (Date.now() - t) / 1000 });
    });
  });
}
function apply(copy, m) {
  const f = path.join(copy, m.file), orig = fs.readFileSync(f, 'utf8');
  let text = orig; const eol = eolOf(orig);
  for (const [from, to] of m.edits) {
    const n = countIn(text, from);
    if (n !== 1) return { error: `the text to change is found ${n} times in ${m.file} (must be once): ${JSON.stringify(from.slice(0, 80))}` };
    text = text.replace(inEol(from, eol), () => inEol(to, eol));
  }
  fs.writeFileSync(f, text);
  const parse = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (parse.status !== 0) { fs.writeFileSync(f, orig); return { error: `the mutant does not parse: ${String(parse.stderr).split('\n').find((l) => /Error/.test(l)) || parse.stderr.slice(0, 160)}` }; }
  return { restore: () => fs.writeFileSync(f, orig) };
}

// ---------- the run: the guards' baselines first, then the mutants, on WORKERS copies ----------
const EXTRA = String(process.env.DA_MUTATION_EXTRA || '').split(',').map((g) => g.trim()).filter(Boolean);
const equivalent = MUTANTS.filter((m) => m.equivalent && (!ONLY.size || ONLY.has(m.id)));   // (not run: why in each, and in T1.md)
const mutants = MUTANTS.filter((m) => !m.equivalent && (!ONLY.size || ONLY.has(m.id)) && (!m.only || m.only.includes(process.platform)))
  .map((m) => (EXTRA.length ? Object.assign({}, m, { guards: [...new Set(m.guards.concat(EXTRA))] }) : m));
const skipped = MUTANTS.filter((m) => m.only && !m.only.includes(process.platform)).map((m) => m.id);
ok(new Set(MUTANTS.map((m) => m.id)).size === MUTANTS.length, 'two mutants share an id');
// an equivalent mutant is not run, but its text must still be in real code, once (a stale one fails loudly)
for (const m of equivalent) for (const [from] of m.edits) { const f = path.join(REPO, m.file); ok(fs.existsSync(f) && countIn(fs.readFileSync(f, 'utf8'), from) === 1, `${m.id} (equivalent): its text is not found once in ${m.file}: the code moved, retarget it`); }
// every mutant applies once to its file with CRLF line ends too, as a Windows checkout has them (checked on every platform)
{ const off = MUTANTS.flatMap((m) => m.edits.map(([from]) => [m.id, countIn(fs.readFileSync(path.join(REPO, m.file), 'utf8').replace(/\r?\n/g, '\r\n'), from)]).filter(([, n]) => n !== 1));
  ok(!off.length, `with CRLF line ends these mutants do not apply once: ${JSON.stringify(off)}`); }
const guards = [...new Set(mutants.flatMap((m) => m.guards))];
const copies = Array.from({ length: WORKERS }, (_, k) => makeCopy(k));
const baseline = new Map();
async function pool(jobs, work) {
  let next = 0;
  await Promise.all(copies.map(async (copy) => { while (next < jobs.length) { const j = jobs[next++]; await work(copy, j); } }));
}
await pool(guards, async (copy, g) => { const r = await runGuard(copy, g); baseline.set(g, r); });
for (const g of guards) { const r = baseline.get(g); ok(!r.failed, `baseline: ${g} fails on the unmutated copy (${r.result}): a kill by it would mean nothing`); }
const badBaseline = new Set(guards.filter((g) => baseline.get(g).failed));
await pool(mutants, async (copy, m) => {
  const a = apply(copy, m);
  if (!ok(!a.error, `${m.id}: ${a.error}`)) return;
  const by = [];
  try {
    for (const g of m.guards) {
      if (badBaseline.has(g)) continue;
      const r = await runGuard(copy, g);
      by.push(Object.assign({ guard: g }, r));
      if (r.failed && !ALL) break;
    }
  } finally { a.restore(); }
  const k = by.filter((r) => r.failed);
  if (ok(k.length > 0, `${m.id} SURVIVED (${m.file}): no guard failed (${by.map((r) => `${r.guard}: ${r.result}`).join('; ')})`)) killed.push(m.id);
  lines.push(`${m.id.padEnd(20)} ${k.length ? 'killed by ' + k.map((r) => r.guard.replace(/\.mjs$/, '') + (r.timedOut ? ' (timeout)' : '')).join(', ') : 'SURVIVED'}`);
});
for (const copy of copies) { try { fs.unlinkSync(path.join(copy, 'mcp', 'node_modules')); } catch (e) { /* gone */ } }
fs.rmSync(TMP, { recursive: true, force: true });

const secs = Math.round((Date.now() - T0) / 1000);
if (process.env.DA_MUTATION_ALL || process.env.DA_MUTATION_VERBOSE) lines.sort().forEach((l) => console.log('  ' + l));
if (problems.length) {
  problems.forEach((p) => console.log('  - ' + p));
  console.log(`FAIL  mutation  ${problems.length} of ${checks} checks (${mutants.length} mutants, ${mutants.length - killed.length} not killed, ${secs}s)`);
  process.exit(1);
}
console.log(`PASS  mutation  ${checks} checks (${mutants.length} mutants, all killed, ${guards.length} guard suites, ${secs}s${equivalent.length ? `; equivalent, not run: ${equivalent.map((m) => m.id).join(', ')}` : ''}${skipped.length ? `; not on ${process.platform}: ${skipped.join(', ')}` : ''})`);
