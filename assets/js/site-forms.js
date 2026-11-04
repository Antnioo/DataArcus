/*
 * DataArcus forms (0.3.2 SP35: main.js section 5), tracking-free.
 *
 * Interface: window.SiteForms, no state of its own beyond each form's listeners.
 *   init()                main.js calls it on DOMContentLoaded: attach() for #contact-form and #beta-form, and the
 *                         validation UX on every .form-control (focused, is-valid, is-invalid).
 *   attach(form, result)  In: a <form> and the element that shows its result (either missing: nothing happens).
 *                         On submit: the form's fields as JSON to Web3Forms; the status messages from
 *                         window.commonTranslations[lang].formMsg (wait, sending, success, error), English as a
 *                         fallback; the form is reset only after a successful send. Out: DOM changes, and after a
 *                         successful send one event: document 'dataarcus:lead', detail { formId } (the form's id
 *                         only). site-analytics.js turns it into generate_lead or beta_request.
 * It calls no tracker and reads no consent (scripts/tests/sp35.mjs M2).
 */
window.SiteForms = (() => {

  /**
   * 5. Forms
   * Handles submission and validation for all forms on the site.
   */

  // Status messages follow the page language (keys in translations/common.js)
  const formMsg = (key) => {
    const all = window.commonTranslations || {};
    const t = (all[document.documentElement.lang === 'ar' ? 'ar' : 'en'] || {}).formMsg || {};
    return t[key] || ((all.en || {}).formMsg || {})[key] || '';
  };

  // Generic form submission handler for Web3Forms
  const handleFormSubmit = (form, resultContainer) => {
    if (!form || !resultContainer) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(form);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);
      const formButton = form.querySelector('button[type="submit"]');
      const originalButtonHtml = formButton.innerHTML;

      resultContainer.innerHTML = `<div class="alert alert-info mt-3">${formMsg('wait')}</div>`;
      resultContainer.style.display = 'block';
      formButton.innerHTML = `<i class="bi bi-hourglass-split me-2"></i>${formMsg('sending')}`;
      formButton.disabled = true;

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: json
      })
      .then((response) => {
        const ok = response.status === 200;
        if (ok) {
          // Tell the analytics adapter (site-analytics.js) that a lead came in
          document.dispatchEvent(new CustomEvent('dataarcus:lead', { detail: { formId: form.id } }));
          // Clear the form only after a successful send, so a failed send keeps what the visitor wrote
          form.reset();
        }
        resultContainer.innerHTML = `<div class="alert ${ok ? 'alert-success' : 'alert-danger'} mt-3">${formMsg(ok ? 'success' : 'error')}</div>`;
      })
      .catch(error => {
        console.error(error);
        resultContainer.innerHTML = `<div class="alert alert-danger mt-3">${formMsg('error')}</div>`;
      })
      .finally(() => {
        formButton.innerHTML = originalButtonHtml;
        formButton.disabled = false;
        setTimeout(() => resultContainer.style.display = 'none', 6000);
      });
    });

    // NEW: Add event listeners to inputs to clear the result message on new input
    const formInputs = form.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
      input.addEventListener('input', () => {
        if (resultContainer.style.display !== 'none') {
          resultContainer.style.display = 'none';
          resultContainer.innerHTML = '';
        }
      });
    });
  };


  const attach = handleFormSubmit;

  const init = () => {
    // Initialize form handlers
    handleFormSubmit(document.getElementById('contact-form'), document.getElementById('form-result'));
    handleFormSubmit(document.getElementById('beta-form'), document.getElementById('beta-form-result'));

    // Add focus/blur and validation effects to form inputs
    document.querySelectorAll('.form-control').forEach(input => {
      input.addEventListener('focus', () => input.parentElement.classList.add('focused'));
      input.addEventListener('blur', () => {
        if (!input.value) input.parentElement.classList.remove('focused');
      });
      input.addEventListener('input', () => {
        const isValid = input.checkValidity();
        input.classList.toggle('is-valid', isValid && input.value);
        input.classList.toggle('is-invalid', !isValid && input.value);
      });
    });
  };

  return { init, attach };
})();
