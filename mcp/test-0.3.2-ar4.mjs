// AR4 (0.3.2; the owner, D-1105-15, D-1105-02, D-1105-05; written red first): the reader's "several models at the same
// level" message in Arabic for an Arabic speaker, with the dual for 2 («نموذجين») and «N نماذج» for 3 and up, as the
// website says it (AR2). The person is Arabic when the path they gave, or a tied folder, holds Arabic letters.
// The English words stay as they were. Made-up names only.   node test-0.3.2-ar4.mjs
import { wordOf } from './lib/read-words.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const many = (p, models) => { const e = new Error(`"${p}" holds ${models.length} models at the same level: ${models.join('; ')}.`); e.code = 'MANY_MODELS'; e.data = { path: p, models }; return e; };
const names = (n) => Array.from({ length: n }, (_, i) => 'M' + String.fromCharCode(65 + i) + '.SemanticModel');
const EN_TAIL = ' Give read_model the path of the one you mean.';

// English: unchanged, word for word
for (const n of [2, 3, 12]) { const e = many('Models', names(n)); chk(() => wordOf(e) === e.message + EN_TAIL, () => `E${n}: English changed: ${wordOf(e)}`); }
// Arabic (the path the person gave has Arabic letters)
const AR = (p, n, c) => `يحتوي "${p}" على ${c} في المستوى نفسه: ${names(n).join('; ')}. أعطِ read_model مسار النموذج الذي تقصده.`;
for (const [n, c] of [[2, 'نموذجين'], [3, '3 نماذج'], [10, '10 نماذج'], [11, '11 نماذج'], [12, '12 نماذج']]) { const e = many('نماذج', names(n)); chk(() => wordOf(e) === AR('نماذج', n, c), () => `A${n}: ${wordOf(e)}`); }
// Arabic letters in a tied folder (the path is English)
{ const m = ['مبيعات.SemanticModel', 'B.SemanticModel']; const e = many('Models', m); chk(() => wordOf(e) === `يحتوي "Models" على نموذجين في المستوى نفسه: ${m.join('; ')}. أعطِ read_model مسار النموذج الذي تقصده.`, () => 'AF: ' + wordOf(e)); }
// the named kind and the other codes: untouched
{ const e = new Error('More than one model in the working folder is named "x": a; b.'); e.code = 'MANY_MODELS_NAMED'; e.data = { name: 'x', hits: ['a', 'b'] }; chk(() => wordOf(e) === e.message + EN_TAIL, () => 'N: ' + wordOf(e)); }

if (problems.length) { console.log(`FAIL script=test-0.3.2-ar4.mjs cause=${JSON.stringify(problems[0].slice(0, 200))}`); console.log(`FAIL  ar4  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n')); process.exit(1); }
console.log(`PASS  ar4  ${checks} checks`);
