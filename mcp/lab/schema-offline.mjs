// TR2 ask 3 (D-1111-06): Microsoft's report validator reads its JSON schemas from a saved copy in the repo, not the
// network. CL-2 (custom-visuals-lab) had 2 false reds in 3 days (8 and 10 Nov: PBIR_SCHEMA_UNREACHABLE, a full extra
// run of 881 s). Loaded with `node --import lab/schema-offline.mjs cli.js validate ...`: https.get for a schema URL is
// answered from lab/schemas/ (same path as the URL under /json-schemas/); a URL with no saved copy answers 404, it
// never reaches the network. test-0.3.1-custom-visuals-lab.mjs CL-2b pins every saved file by sha256 (schemas/pins.json).
//   DATAARCUS_SCHEMA_LOG=<file>   appends one line per URL served (the test reads it)
//   DATAARCUS_SCHEMA_LIVE=1       no patch: the real network (the refresh script uses this)
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SAVED = path.join(HERE, 'schemas');
export const ROOT_URL = 'https://developer.microsoft.com/json-schemas/';
export const fileOf = (url) => (String(url).startsWith(ROOT_URL) ? path.join(SAVED, String(url).slice(ROOT_URL.length)) : null);

if (process.env.DATAARCUS_SCHEMA_LIVE !== '1') {
  https.get = function (url, opts, cb) {
    if (typeof opts === 'function') { cb = opts; }
    const f = fileOf(url), log = process.env.DATAARCUS_SCHEMA_LOG;
    const res = new Readable({ read() {} });
    res.statusCode = f && fs.existsSync(f) ? 200 : 404; res.headers = {};
    if (res.statusCode === 200) res.push(fs.readFileSync(f)); res.push(null);
    if (log) fs.appendFileSync(log, `${res.statusCode} ${url}\n`);
    const req = { on() { return req; }, destroy() {}, setTimeout() { return req; } };
    setImmediate(() => cb && cb(res));
    return req;
  };
}
