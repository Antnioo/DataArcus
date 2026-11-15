// (HK2, 0.3.3, B-414) The base engine of a split suite (sp6, sp29): the bytes of assets/js/design-engine.min.js as a commit
// that is not on main had it, saved under mcp/fixtures/hk1/<suite>/ and checked against a pinned SHA-256. The default path
// never touches git (main is reached by squash, so those commits are missing from main and from a fresh clone). An env
// override (SP6_BASE, SP29_BASE) is an opt-in: when set, the file is read from that commit with git show.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

// returns { bytes, label } or throws an Error that says what is wrong
export function baseEngine({ suite, envName, commit, sha256 }) {
  const override = process.env[envName];
  if (override) return { bytes: execFileSync('git', ['show', `${override}:assets/js/design-engine.min.js`], { cwd: ROOT, maxBuffer: 1 << 26 }), label: override };
  const file = path.join(ROOT, 'mcp', 'fixtures', 'hk1', suite, 'assets', 'js', 'design-engine.min.js');
  const bytes = fs.readFileSync(file);
  const got = createHash('sha256').update(bytes).digest('hex');
  if (got !== sha256) throw new Error(`${path.relative(ROOT, file)} is not the bytes of ${commit} (sha256 ${got}, expected ${sha256})`);
  return { bytes, label: commit };
}
