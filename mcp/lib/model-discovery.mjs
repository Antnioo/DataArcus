// Model discovery, for the model reader (mcp/lib/model.mjs; 0.3.2 SP42, the Codex split map's "model discovery/errors"):
// which model a path or a plain name means, found by listing folders only. Never a file's bytes: no file is opened or
// read here, and no link is followed (a link is left out, and listed when asked). It gives candidate paths, never
// authority: model.mjs puts every path it gets from here through its containment (realIn: the real path inside the
// working folder) before any stat or read, and reads through its own capped readers.
// Interface:
//   walk(dir, depth?, links?) -> the files and folders under dir (4 levels; links left out, pushed to links when given)
//   byName(name, root, prefer?) -> the one model folder or project folder of that name | throws ReadError
//     MANY_MODELS_NAMED or NO_MODEL_NAMED (the models there: relative, screened, 12 at most, prefer's first)
//   noModelAt(path, root) -> the ReadError NO_MODEL_AT for a path with a folder part that is not there (returned, not thrown)
//   modelFolders(full, links?) -> the model folders (.SemanticModel, .Dataset) at or under full, in the walk's order
//   nearestModel(dirs, root, path) -> the nearest of dirs | throws ReadError MANY_MODELS when two are at that depth
//   ReadError(code, data, message): the reader's coded error (model.mjs re-exports it)
// No state: every answer comes from its arguments and the folders listed at the call.
import fs from 'node:fs';
import path from 'node:path';
import { shownPath } from './model-names.mjs';
// the nearest-model rule is the site's and the MCP's one file (DD1G): a pure module, no folder is read by it
import Nearest from '../../assets/js/model-nearest.js';
const { nearest } = Nearest;

// A reading error: a code and its data, for the tool layer to word (A1-9, the audit of the reading block: the reader
// spoke as the MCP tool). Its message is a plain fallback that names no tool.
export class ReadError extends Error { constructor(code, data, message) { super(message); this.code = code; this.data = data || {}; } }

// Links (symbolic links, junctions) are never followed: they are left out, and listed in `links` when given
export const walk = (dir, depth = 0, links = null) => (depth > 4 ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const full = path.join(dir, e.name);
  if (e.name === 'node_modules' || e.name === '.git') return [];
  if (e.isSymbolicLink()) { if (links) links.push(full); return []; }
  return e.isDirectory() ? [full, ...walk(full, depth + 1, links)] : [full];
}));

// The model folders at or under a folder (a project folder, a model folder), in the walk's order; links left out, and
// pushed to links when given (the caller says why a linked model folder is not read)
export const modelFolders = (full, links) => [full, ...walk(full, 0, links).filter((f) => fs.statSync(f).isDirectory())].filter((d) => /\.(SemanticModel|Dataset)$/i.test(d));
// The model folder nearest to the top wins (a backup copy deeper down never does)
export function nearestModel(dirs, root, p) {
  // (SQ6, 0.2.9-checks-S4; SQ15a, the owner's yes) two model folders at the nearest depth (two projects side by side):
  // never the first one the folder lists, silently; both named, as for two models of one name. The rule is
  // model-nearest.js's; this keeps the ReadError and its message
  const { tied } = nearest(dirs, path.sep);
  if (tied.length > 1) { const rel = (d) => shownPath(path.relative(root, d)); throw new ReadError('MANY_MODELS', { path: p, models: tied.map(rel) }, `"${p}" holds ${tied.length} models at the same level: ${tied.map(rel).join('; ')}.`); }
  return tied[0];
}

// A model asked for by its plain name ("Ramadan Test", "Ramadan Test.pbip"), when no file or folder of that path
// exists: the one model folder, .pbip or project folder of that name inside the working folder (any letter case;
// links are not followed). None, or more than one: an error that says what is there, never a guess.
export function byName(p, root, prefer) {
  const strip = (n) => String(n).replace(/\.(pbip|SemanticModel|Dataset)$/i, ''), want = strip(p).trim().toLowerCase(), isModel = (n) => /\.(SemanticModel|Dataset)$/i.test(n);
  const hits = new Set(), models = [];
  // (the audit's "seen": one folder that cannot be read never fails the whole search)
  const readdirSafe = (d, opts) => { try { return fs.readdirSync(d, opts); } catch (e) { return []; } };
  const visit = (dir, depth) => { const list = readdirSafe(dir, { withFileTypes: true });
    for (const e of list) {
      if (e.isSymbolicLink() || e.name === 'node_modules' || e.name === '.git') continue;
      const full = path.join(dir, e.name), same = strip(e.name).toLowerCase() === want;
      if (e.isDirectory() && isModel(e.name)) { models.push(full); if (same) hits.add(full); continue; }
      if (e.isDirectory() && /\.Report$/i.test(e.name)) continue;
      // a .pbip: the model folder of the same name beside it, else its folder (the nearest model in it)
      if (!e.isDirectory() && /\.pbip$/i.test(e.name) && same) { const m = list.find((x) => x.isDirectory() && isModel(x.name) && strip(x.name).toLowerCase() === want); hits.add(m ? path.join(dir, m.name) : dir); }
      if (e.isDirectory()) { if (same && readdirSafe(full).some((n) => isModel(n))) hits.add(full); if (depth < 3) visit(full, depth + 1); }
    } };
  visit(root, 0);
  // (A1-12, the audit of the reading block: folder names from disk are screened before they reach a message)
  const rel = (f) => shownPath(path.relative(root, f)) || '.';
  if (hits.size === 1) return [...hits][0];
  // (0.3.1 MX3, laptop part 9: a mistyped path listed the whole folder's models first) the named folder's models first
  const all = models.map(rel).sort((x, y) => (prefer && !x.startsWith(prefer + '/') ? 1 : 0) - (prefer && !y.startsWith(prefer + '/') ? 1 : 0));
  if (hits.size > 1) throw new ReadError('MANY_MODELS_NAMED', { name: p, hits: [...hits].map(rel) }, `More than one model in the working folder is named "${p}": ${[...hits].map(rel).join('; ')}.`);
  throw new ReadError('NO_MODEL_NAMED', { name: p, root, models: all.slice(0, 12), more: Math.max(0, all.length - 12) }, `No model named "${p}" in the working folder ${root}.${modelsThere(all)}`);
}
export const modelsThere = (all) => (all.length ? ' Models there: ' + all.slice(0, 12).join('; ') + (all.length > 12 ? '; and ' + (all.length - 12) + ' more' : '') + '.' : '');
// (0.3.1 MR1, B-271: the MCP review) a path with a folder part that does not exist ("twin-project/Twin Sale.SemanticModel"):
// the models in the working folder listed as for a bare wrong name (byName's search: relative, screened, capped at 12),
// never an internal error, and never a guess at the model meant
export function noModelAt(p, root) {
  let models = [], more = 0;
  // the nearest folder of the path that is there (relative to the working folder): its models are listed first
  let near = path.dirname(String(p)); while (near && near !== '.' && near !== path.dirname(near) && !fs.existsSync(path.resolve(root, near))) near = path.dirname(near);
  const prefer = near && near !== '.' ? shownPath(path.relative(root, path.resolve(root, near))) : null;
  try { byName('\u0000', root, prefer); } catch (e) { if (e && e.code === 'NO_MODEL_NAMED') { models = e.data.models; more = e.data.more; } else throw e; }
  const shown = shownPath(String(p));
  return new ReadError('NO_MODEL_AT', { path: shown, root, models, more }, `Nothing at "${shown}" in the working folder ${root}.${modelsThere(models.concat(Array(more).fill('')))}`);
}
