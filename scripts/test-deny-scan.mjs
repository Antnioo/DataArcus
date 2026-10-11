#!/usr/bin/env node
// Tests for deny-scan.mjs on a made-up repository with made-up words (never a real deny word).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { squash, termsOf, scanText, scanRepo } from './deny-scan.mjs';

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

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deny-'));
const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
git('init', '-q'); git('config', 'user.email', 't@example.com'); git('config', 'user.name', 't');
fs.writeFileSync(path.join(dir, 'clean.md'), 'all good\n');
git('add', '.'); git('commit', '-qm', 'first');
const base = git('rev-parse', 'HEAD').trim();
fs.mkdirSync(path.join(dir, 'qwerty_corp'));
fs.writeFileSync(path.join(dir, 'qwerty_corp', 'x.txt'), 'line one\nZeta Widgets\n');
fs.writeFileSync(path.join(dir, 'bin.dat'), Buffer.from([0, 1, 2, 0x7a, 0x65, 0x74, 0x61]));
git('add', '.'); git('commit', '-qm', 'about Zeta-Widgets');

t('a repository: path, text and commit message are all found; binary skipped', () => {
  const hits = scanRepo(dir, termsOf('zeta widgets, qwerty corp'), base + '..HEAD');
  const where = hits.map((h) => h.where + ':' + h.line + ':' + h.term).sort();
  assert.deepEqual(where, [
    'commit message ' + git('rev-parse', '--short=7', 'HEAD').trim() + ':1:1',
    'qwerty_corp/x.txt (its path):0:2',
    'qwerty_corp/x.txt:2:1',
  ]);
});
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n} checks passed`);
