#!/usr/bin/env node
// Tests for deny-scan.mjs on a made-up repository with made-up words (never a real deny word).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { squash, termsOf, scanText, scanRepo, textOf } from './deny-scan.mjs';

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('squash ignores case, spaces and punctuation, keeps Arabic', () => {
  assert.equal(squash('Zeta-Widgets_Co'), 'zetawidgetsco');
  assert.equal(squash('شركة زيتا'), 'شركةزيتا');
});
t('terms: comma or line separated, short ones dropped', () => {
  assert.deepEqual(termsOf('Zeta Widgets, abc\nqwerty-corp'), ['zetawidgets', 'qwertycorp']);
});
t('a match is told by number and line, never by the word', () => {
  const hits = scanText('hello\nwe work at ZETA widgets now', termsOf('zeta widgets'), 'a.md');
  assert.deepEqual(hits, [{ where: 'a.md', line: 2, term: 1 }]);
  assert.ok(!JSON.stringify(hits).includes('zeta'));
});
t('no match, no hit', () => {
  assert.deepEqual(scanText('nothing here', termsOf('zeta widgets'), 'a.md'), []);
});
t('a binary file is read for its text runs, ASCII and UTF-16 (a word inside an image or a .pbix is found)', () => {
  const bin = Buffer.concat([Buffer.from([0, 1, 2, 0xff]), Buffer.from('made by Zeta Widgets', 'latin1'), Buffer.from([0, 0]), Buffer.from('qwerty corp', 'utf16le'), Buffer.from([0, 7])]);
  const hits = scanText(textOf(bin), termsOf('zeta widgets, qwerty corp'), 'x.png').map((h) => h.term).sort();
  assert.deepEqual(hits, [1, 2]);
});
t('the scan fails closed: no DENY_TERMS is a failed check, never a pass', () => {
  let code = 0;
  try { execFileSync(process.execPath, [path.join(path.dirname(new URL(import.meta.url).pathname), 'deny-scan.mjs'), '.'], { env: { ...process.env, DENY_TERMS: '' }, stdio: 'pipe' }); }
  catch (e) { code = e.status; }
  assert.equal(code, 1);
});

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deny-'));
const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
git('init', '-q'); git('config', 'user.email', 't@example.com'); git('config', 'user.name', 't');
fs.writeFileSync(path.join(dir, 'clean.md'), 'all good\n');
git('add', '.'); git('commit', '-qm', 'first');
const base = git('rev-parse', 'HEAD').trim();
fs.mkdirSync(path.join(dir, 'qwerty_corp'));
fs.writeFileSync(path.join(dir, 'qwerty_corp', 'x.txt'), 'line one\nZeta Widgets\n');
fs.writeFileSync(path.join(dir, 'bin.dat'), Buffer.concat([Buffer.from([0, 1, 2]), Buffer.from('qwerty corp inside', 'utf16le')]));
git('add', '.'); git('commit', '-qm', 'about Zeta-Widgets');

t('a repository: path, text, commit message, the commit\'s added lines and a binary file\'s text are all found', () => {
  const hits = scanRepo(dir, termsOf('zeta widgets, qwerty corp'), base + '..HEAD');
  const where = hits.map((h) => h.where + ':' + h.line + ':' + h.term).sort();
  const head = git('rev-parse', '--short=7', 'HEAD').trim();
  assert.deepEqual(where, [
    'bin.dat (its binary text):0:2',
    'commit message ' + head + ':1:1',
    `qwerty_corp/x.txt (a line added in commit ${head}):0:1`,
    'qwerty_corp/x.txt (its path):0:2',
    `qwerty_corp/x.txt (its path, commit ${head}):0:2`,
    'qwerty_corp/x.txt:2:1',
  ]);
});
// a word added in one commit and removed in the next is still found (the checkout alone would miss it)
fs.writeFileSync(path.join(dir, 'clean.md'), 'all good\nqwerty corp was here\n');
git('add', '.'); git('commit', '-qm', 'add');
const mid = git('rev-parse', '--short=7', 'HEAD').trim();
fs.writeFileSync(path.join(dir, 'clean.md'), 'all good\n');
git('add', '.'); git('commit', '-qm', 'remove again');
t('a word added and removed again is found in the commit that added it', () => {
  const hits = scanRepo(dir, termsOf('qwerty corp'), base + '..HEAD').filter((h) => h.where.includes('commit ' + mid));
  assert.equal(hits.length, 1);
  assert.match(hits[0].where, /^clean\.md \(a line added in commit/);
});
t('a first push (before = zeros) still reads the new commits', () => {
  const hits = scanRepo(dir, termsOf('zeta widgets'), '0000000000000000000000000000000000000000..HEAD');
  assert.ok(hits.some((h) => h.where.startsWith('commit message')), 'the commit message with the word is read');
});
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n} checks passed`);
