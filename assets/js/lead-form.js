// The sign-up form of the Arabic-ready checklist (resources/arabic-report-checklist.html, LEAD1). The endpoint is the
// form's own action, the one place it is written (Formspree's address with the owner's form id). While it still reads
// FORM_ID_HERE the form is not live: the page says so and the form is off. Otherwise it is sent with fetch (the page
// stays): on success the download links show at once; on failure the page says so and offers email and WhatsApp.
(function () {
  const form = document.getElementById('lead-form');
  if (!form) return;
  const endpoint = form.getAttribute('action');
  const show = (id, on) => { document.getElementById(id).hidden = !on; };
  const button = form.querySelector('button[type="submit"]');
  if (/FORM_ID_HERE/.test(endpoint)) {
    show('lead-off', true);
    form.querySelectorAll('input, select, button').forEach((e) => { e.disabled = true; });
    return;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    // the language the visitor read the page in, so the follow-ups can be written in it
    form.elements.language.value = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    button.disabled = true;
    show('lead-fail', false);
    let sent = false;
    try {
      const r = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      sent = r.ok;
    } catch (err) { sent = false; }
    if (sent) {
      form.hidden = true;
      show('lead-ok', true);
      document.getElementById('lead-ok').focus();
    } else {
      show('lead-fail', true);
      button.disabled = false;
    }
  });
})();
