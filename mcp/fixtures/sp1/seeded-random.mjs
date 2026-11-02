// test-0.3.2-sp1.mjs only (SP1): loaded into the server it starts (NODE_OPTIONS --import), so the random ids a plan
// makes (the plan id, page and visual ids, logical ids) come from one fixed seed, and the same code gives the same answer
// byte for byte, digests and the order of lists by id included. Never loaded by the server itself.
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
let s = 0x5eed51;
const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s & 255; };
const fill = (b) => { const u = new Uint8Array(b.buffer, b.byteOffset, b.byteLength); for (let i = 0; i < u.length; i++) u[i] = next(); return b; };
crypto.randomBytes = (n, cb) => { const b = fill(Buffer.alloc(n)); if (cb) { cb(null, b); return undefined; } return b; };
crypto.randomFillSync = (b) => fill(b);
crypto.randomUUID = () => { const h = fill(Buffer.alloc(16)); h[6] = (h[6] & 0x0f) | 0x40; h[8] = (h[8] & 0x3f) | 0x80; const x = h.toString('hex'); return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`; };
// the browser-shaped engines (assets/js) take globalThis.crypto.getRandomValues
const web = globalThis.crypto || crypto.webcrypto;
try { Object.defineProperty(web, 'getRandomValues', { value: (b) => fill(b), configurable: true, writable: true }); } catch (e) { Object.defineProperty(Object.getPrototypeOf(web), 'getRandomValues', { value: (b) => fill(b), configurable: true, writable: true }); }
// and Math.random: an engine loaded with require has no root.crypto (its root is module.exports) and falls back to it
Math.random = () => (next() * 16777216 + next() * 65536 + next() * 256 + next()) / 4294967296;
syncBuiltinESMExports();
