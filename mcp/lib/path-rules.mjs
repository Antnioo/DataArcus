// The MCP's path rules, one copy each (0.3.2 WN1, Codex's Windows review of 8 Nov: F01, F02, F05). Nothing is written
// here and only sameOnDisk reads the disk (a real path); the others take the path module (`path`, or `path.win32` /
// `path.posix` in a test) and the platform, so the Windows answers are checked on any system.
// - outsideRel / within: is a path outside a folder? The one containment rule (F01: testing the first two characters
//   for '..' also refused a folder inside whose name begins with two dots, `..draft`). Outside means the relative
//   path is exactly '..', or begins with '..' and a separator, or is absolute (another drive, another share).
// - samePath / sameName: two paths or two names the same, without regard to case where the platform's files are found
//   without it (Windows, macOS; F02: a .pbip naming `demo.Report` beside the folder `Demo.Report`).
// - pathMax / longestPath: the longest full path a write will make, against the platform's limit (F05: Windows'
//   260 characters, MAX_PATH with its closing NUL, which Power BI Desktop keeps), so a plan that can't be written is
//   refused before the approval, not half-way through the write.
import fs from 'node:fs';
import path from 'node:path';

const sepsOf = (P) => (P.sep === '\\' ? ['\\', '/'] : ['/']);

/** A relative path (from path.relative, either separator on Windows) that leads outside the folder it is relative to. */
export function outsideRel(rel, P = path) {
  const r = String(rel == null ? '' : rel);
  return r === '..' || sepsOf(P).some((s) => r.startsWith('..' + s)) || P.isAbsolute(r);
}

/** p is root itself or inside it, by name (links are the caller's: model.mjs real()). */
export const within = (root, p, P = path) => !outsideRel(P.relative(root, p), P);

/** Whether the platform's files are found without regard to case (Windows and, by default, macOS). */
export const caseless = (platform = process.platform) => platform === 'win32' || platform === 'darwin';

/** Two names (a folder's, a report's) the same on this platform. */
export const sameName = (a, b, platform = process.platform) => (caseless(platform) ? String(a).toLowerCase() === String(b).toLowerCase() : String(a) === String(b));

/** Two paths to the same place by name on this platform: both resolved, then compared as sameName. */
export const samePath = (a, b, platform = process.platform, P = path) => sameName(P.resolve(String(a)), P.resolve(String(b)), platform);

/** Two paths to the same folder or file on this disk: their real paths compared (Windows and macOS give the name as it
 *  is on disk, so "demo.Report" and "Demo.Report" are one folder there and two names on Linux), else samePath when
 *  either is not there. */
export function sameOnDisk(a, b) {
  try { return samePath(fs.realpathSync.native(path.resolve(String(a))), fs.realpathSync.native(path.resolve(String(b)))); } catch (e) { return samePath(a, b); }
}

/** The longest full path a file may have on the platform: Windows 259 (MAX_PATH 260 with its NUL; Power BI Desktop
 *  opens the project's files with it), macOS 1023, others 4095. DATAARCUS_TEST_PATH_MAX can only lower it (the tests). */
export function pathMax(platform = process.platform) {
  const os = platform === 'win32' ? 259 : platform === 'darwin' ? 1023 : 4095, v = Number(process.env.DATAARCUS_TEST_PATH_MAX);
  return Number.isFinite(v) && v > 0 ? Math.min(os, v) : os;
}

/** The longest full path of files ([{ path: 'A.Report/definition/...' }], '/' between parts) written into dir, when it is
 *  over the platform's limit: { path, length, max } (path relative to dir, with '/'); else null. */
export function longestPath(dir, files, platform = process.platform, P = path) {
  const max = pathMax(platform);
  let worst = null;
  for (const f of files || []) {
    const rel = String(f && f.path != null ? f.path : f), full = P.join(String(dir), ...rel.split('/'));
    if (!worst || full.length > worst.length) worst = { path: rel, length: full.length };
  }
  return worst && worst.length > max ? Object.assign(worst, { max }) : null;
}

/** longestPath in words, for a refusal before anything is written; null when every path fits. */
export function tooLongSaid(dir, files, platform = process.platform, P = path) {
  const w = longestPath(dir, files, platform, P);
  return w ? `its deepest file's path would be ${w.length} characters, and ${platform === 'win32' ? 'Windows and Power BI Desktop allow' : 'this system allows'} ${w.max}: use a shorter report name or move the project to a shorter folder (for example ${platform === 'win32' ? 'C:\\PBI' : '~/PBI'}), then plan again` : null;
}
