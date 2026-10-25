// The Arabic checklist's sign-up form (LEAD1, resources/arabic-report-checklist.html), in English and Arabic:
//   - not live (its action still https://formspree.io/f/FORM_ID_HERE): the page says so and the form is off
//   - live (a made-up form id served in place of FORM_ID_HERE; Formspree stubbed, nothing leaves the machine): a sent
//     form shows the two PDF links at once (files that exist) and sends the email and the page's language; a refused or
//     failed send says so and offers the email and WhatsApp buttons, and the form stays
import { visitor, ready } from './lib.mjs';

const PAGE = '/resources/arabic-report-checklist.html';
const state = (pg) => pg.evaluate(() => {
  const vis = (id) => { const e = document.getElementById(id); return !!e && !e.hidden && e.offsetParent !== null; };
  return { off: vis('lead-off'), ok: vis('lead-ok'), fail: vis('lead-fail'), form: vis('lead-form'),
    disabled: document.querySelector('#lead-form button[type="submit"]').disabled,
    offText: document.getElementById('lead-off').innerText.trim(),
    pdfs: [...document.querySelectorAll('#lead-ok a[href$=".pdf"]')].map((a) => a.getAttribute('href')),
    contact: [...document.querySelectorAll('#lead-fail a')].map((a) => a.getAttribute('href')) };
});

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

  for (const lang of ['en', 'ar']) {
    // not live
    let v = await visitor(browser);
    await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(v.pg);
    let s = await state(v.pg);
    check(s.off && s.disabled, `${lang} not live: the notice must show and the button be off (notice ${s.off}, off ${s.disabled})`);
    check(lang === 'ar' ? /غير مفعّل/.test(s.offText) : /not live yet/.test(s.offText), `${lang} not live: the notice reads "${s.offText}"`);
    if (v.errs.length) problems.push(`${lang} not live: ${v.errs.join(' | ')}`);
    await v.ctx.close();

    // live: Formspree answers 200, then 500, then nothing
    for (const answer of [200, 500, 'abort']) {
      v = await visitor(browser);
      const sent = [];
      await v.pg.route(`${url}${PAGE}*`, async (rt) => { const r = await rt.fetch(); rt.fulfill({ response: r, body: (await r.text()).replace('FORM_ID_HERE', 'xtestid1') }); });
      await v.pg.route('https://formspree.io/**', (rt) => {
        sent.push({ url: rt.request().url(), body: rt.request().postData() || '' });
        if (answer === 'abort') return rt.abort();
        return rt.fulfill({ status: answer, contentType: 'application/json', body: answer === 200 ? '{"ok":true}' : '{"error":"x"}' });
      });
      await v.pg.goto(`${url}${PAGE}?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(v.pg);
      s = await state(v.pg);
      check(!s.off && !s.disabled, `${lang} live: no notice and the button on (notice ${s.off}, off ${s.disabled})`);
      // the email is required: an empty form is not sent
      await v.pg.click('#lead-form button[type="submit"]');
      await v.pg.waitForTimeout(200);
      check(!sent.length, `${lang} live: a form without an email was sent`);
      await v.pg.fill('#lead-email', 'test@example.com');
      await v.pg.selectOption('#lead-role', 'developer');
      await v.pg.click('#lead-form button[type="submit"]');
      await v.pg.waitForFunction(() => !document.getElementById('lead-ok').hidden || !document.getElementById('lead-fail').hidden, null, { timeout: 15000 }).catch(() => {});
      s = await state(v.pg);
      check(sent.length === 1 && sent[0].url === 'https://formspree.io/f/xtestid1', `${lang} ${answer}: one send to the form's action (${sent.map((x) => x.url).join(', ')})`);
      if (sent[0]) check(/test@example\.com/.test(sent[0].body) && new RegExp(`name="language"\\r\\n\\r\\n${lang}\\r\\n`).test(sent[0].body) && /name="role"\r\n\r\ndeveloper/.test(sent[0].body), `${lang} ${answer}: the email, role and language "${lang}" must be sent`);
      if (answer === 200) {
        check(s.ok && !s.form && !s.fail, `${lang} sent: the downloads must show in place of the form (ok ${s.ok}, form ${s.form}, fail ${s.fail})`);
        check(s.pdfs.length === 2, `${lang} sent: two PDF links (${s.pdfs.join(', ')})`);
        for (const p of s.pdfs) { const r = await v.pg.request.get(url + p); check(r.ok() && /application\/pdf/.test(r.headers()['content-type'] || ''), `${lang} sent: ${p} is not a PDF on the site (${r.status()})`); }
      } else {
        check(s.fail && !s.ok && s.form && !s.disabled, `${lang} ${answer}: the failure must show, the form stay and the button come back (fail ${s.fail}, ok ${s.ok}, form ${s.form})`);
        check(s.contact.some((h) => h.startsWith('mailto:hello@DataArcus.com')) && s.contact.some((h) => h.startsWith('https://wa.me/971506583577')), `${lang} ${answer}: the email and WhatsApp buttons (${s.contact.join(', ')})`);
      }
      if (v.errs.filter((e) => !/formspree/.test(e)).length) problems.push(`${lang} ${answer}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }
  return { checks, problems };
}
