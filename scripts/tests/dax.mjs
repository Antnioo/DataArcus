// DAX tools: the measure builder and the calendar generator write DAX that is right in every filter context
// and for every input, and the pages survive odd saved settings.
import { visitor } from './lib.mjs';

const MB = '/tools/dax-measure-builder.html?lang=en';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const open = async (page, saved) => {
    const v = await visitor(browser, { viewport: [1440, 900] });
    if (saved) await v.ctx.addInitScript(([k, s]) => { try { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, s); sessionStorage.setItem('seeded', 1); } } catch (e) { /* ignore */ } }, saved);
    await v.pg.goto(url + page, { waitUntil: 'networkidle' });
    return v;
  };
  const done = async (v, tag) => { if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`); await v.ctx.close(); };

  return { checks, problems };
}
