/*
===================================================================
* Premium DataArcus JavaScript
*
* TABLE OF CONTENTS
* ===================================================================
*
* 1. Initialization & Core Setup
* - Particle Background
* - Animate on Scroll (AOS)
* - Update Footer Year
*
* 2. Navigation & Scrolling
* - Enhanced Navbar Scroll Effect
* - On-Page Smooth Scrolling
* - Cross-Page Anchor Link Correction
*
* 3. Dynamic Animations & Effects
* - Counter Animation for Stats
* - Intersection Observers (Counters & Fades)
* - Dynamic Gradient for CTA
*
* 4. Component-Specific Interactions
* - Close the phone menu on an outside click
* - Button Ripple
*
* 5. Forms
* - Contact Form Handler (messages in English and Arabic)
* - Enhanced Form Validation UX
*
* 6. Utility & Finalization
* - Keyboard Navigation Enhancement
* - Blog search and filters
*
* 7. Analytics Events (GA4 + Clarity)
* - Leads, CTA clicks, contact & outbound links
* - Dashboard engagement, article reads, language, blog search
*
* ===================================================================
*/

document.addEventListener('DOMContentLoaded', () => {

  /**
   * 1. Initialization & Core Setup
   * Handles the initial setup of the page, including the loading screen,
   * background particles, AOS library, and dynamic footer year.
   */

  // Respect the OS-level "reduce motion" setting: skip purely decorative
  // JS-driven animation (particles, card fade-in) for anyone who has it on.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Read the viewport width once, up front, before any DOM writes below.
  // Reading window.innerWidth after a DOM mutation forces the browser to
  // run a synchronous layout recalculation just to answer the query, so
  // caching it here (before the particle/AOS setup that
  // follows) avoids that forced reflow.
  const isDesktopViewport = window.innerWidth > 767;

  // Generate interactive background particles (desktop only, motion allowed).
  // CSS already hides these with display:none on mobile, but skip creating
  // the 50 DOM nodes in the first place rather than just hiding them.
  const interactiveBg = document.getElementById('interactiveBg');
  if (interactiveBg && isDesktopViewport && !prefersReducedMotion) {
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 20}s`;
      particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
      interactiveBg.appendChild(particle);
    }
  }

  // Initialize Animate on Scroll (AOS) library only on desktop
  if (isDesktopViewport) {
    AOS.init({
      once: true,
      duration: prefersReducedMotion ? 0 : 800,
      easing: 'ease-out-cubic',
      disable: prefersReducedMotion
    });
  }

  // Update year in footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }


/**
   * 2. Navigation & Scrolling - FIXED VERSION
   * ==================================================================
   * This version uses consistent 80px offset and simplified logic
   * ==================================================================
   */

  // Simple, reliable navbar scroll effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    
    handleScroll(); // Check on initial load
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Remove focus from navbar-toggler (hamburger icon) after click
  const navbarToggler = document.querySelector('.navbar-toggler');
  if (navbarToggler) {
    navbarToggler.addEventListener('click', () => {
      // Use a brief timeout to ensure the blur happens after other click events
      setTimeout(() => {
        navbarToggler.blur();
      }, 0);
    });
  }

  // SIMPLIFIED smooth scrolling - no complex timing, just works
  document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor || anchor.getAttribute('href') === '#') return;
    
    const targetId = anchor.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      e.preventDefault();
      
      // Simple calculation: element position minus 80px navbar height
      const targetPosition = targetElement.offsetTop - 80;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Close mobile menu if open
      const navmenu = document.querySelector('#navmenu');
      if (navmenu && navmenu.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(navmenu, { toggle: false });
        bsCollapse.hide();
      }
    }
  });

  // Handle page load with hash (cross-page navigation)
  window.addEventListener('load', () => {
    if (window.location.hash) {
      const targetElement = document.querySelector(window.location.hash);
      if (targetElement) {
        // Wait for page to fully render, then scroll
        setTimeout(() => {
          const targetPosition = targetElement.offsetTop - 80;
          window.scrollTo({
            top: targetPosition,
            behavior: 'auto'
          });
        }, 500);
      }
    }
  });


  /**
   * 3. Dynamic Animations & Effects
   * Controls animations that respond to user interaction or visibility,
   * such as counters and element fading.
   */

  // Animate numbers in the stats section when they become visible
  // Falls back to any [data-stats] container on pages without an #about section (e.g. showcase pages).
  const statsSection = document.querySelector('#about') || document.querySelector('[data-stats]');
  if (statsSection) {
    // Duration scales to the number's magnitude: big numbers (e.g. 113,000) get a short,
    // rapid climb; small numbers (e.g. 15) get a longer, more deliberate one. Tuned on a
    // log scale so the difference is visible across the 1-100,000+ range used on the site.
    const MIN_DURATION = 700;   // big numbers: fast/rapid finish
    const MAX_DURATION = 2200;  // small numbers: slow, deliberate finish
    const durationFor = (target) => {
      const magnitude = Math.max(Math.abs(target), 1);
      const scale = Math.min(Math.log10(magnitude) / 4, 1); // 1 -> 0, ~10,000+ -> 1
      return MAX_DURATION - (MAX_DURATION - MIN_DURATION) * scale;
    };

    const animateCounters = () => {
      const counters = statsSection.querySelectorAll('[data-count]');
      counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-count'));
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = durationFor(target);
        const isDecimal = target.toString().includes('.');
        let startTime = null;

        // Timestamp-based (not frame-count-based): the animation takes the
        // same real-world duration regardless of the display's refresh rate,
        // instead of finishing early on 120Hz/144Hz screens.
        const updateCounter = (timestamp) => {
          if (startTime === null) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const current = target * progress;

          if (progress >= 1) {
            counter.textContent = target + suffix;
          } else {
            counter.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
            requestAnimationFrame(updateCounter);
          }
        };
        requestAnimationFrame(updateCounter);
      });
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -100px 0px' });
    
    statsObserver.observe(statsSection);
  }
  
  // Fade in elements as they enter the viewport
  const fadeElements = document.querySelectorAll('.glass-card, .service-card, .portfolio-card');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  if (!prefersReducedMotion) fadeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(el);
  });

  // Animate the gradient on the CTA section
  const ctaSection = document.querySelector('.cta-section');
  if (ctaSection) {
    ctaSection.style.backgroundSize = '400% 400%';
    ctaSection.style.animation = 'gradient-shift 8s ease infinite';
  }


  /**
   * 4. Component-Specific Interactions
   * Manages hover and interaction effects for various components like cards and buttons.
   */
  
  // Close mobile menu when clicking outside of the navbar
  document.addEventListener('click', (event) => {
    const navmenu = document.querySelector('#navmenu');
    if (!navmenu) return; // Exit if the menu element doesn't exist

    const isMenuOpen = navmenu.classList.contains('show');
    const isClickInsideNavbar = event.target.closest('.navbar');

    // If the menu is open and the click was not inside the navbar, hide the menu
    if (isMenuOpen && !isClickInsideNavbar) {
      const bsCollapse = new bootstrap.Collapse(navmenu, { toggle: false });
      bsCollapse.hide();
    }
  });

  // Add a ripple effect to all buttons on click
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });


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
          // Tell the analytics layer (section 7) that a lead came in
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

  // Initialize form handlers
  handleFormSubmit(document.getElementById('contact-form'), document.getElementById('form-result'));
  
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


  /**
   * 6. Utility & Finalization
   * Keyboard shortcuts and the blog search.
   */

  // Enhance keyboard navigation (e.g., closing mobile menu with ESC)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const navmenu = document.querySelector('#navmenu.show');
      if (navmenu) {
        new bootstrap.Collapse(navmenu, { toggle: false }).hide();
      }
    }
  });

  // Blog page functionality
  const blogSearch = document.getElementById('blogSearch');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const blogCards = document.querySelectorAll('[data-category]');

  if (blogSearch && filterButtons.length > 0) {
    // Applies the search term AND the active category filter together, so
    // neither control silently undoes the other (e.g. searching, then
    // clicking a filter, no longer wipes out the search results).
    const applyBlogFilters = () => {
      const searchTerm = blogSearch.value.toLowerCase();
      const activeButton = document.querySelector('[data-filter].active');
      const activeFilter = activeButton ? activeButton.getAttribute('data-filter') : 'all';

      blogCards.forEach(card => {
        const categories = card.getAttribute('data-category');
        const title = card.querySelector('h3').textContent.toLowerCase();
        const excerpt = card.querySelector('.text-white-50').textContent.toLowerCase();
        const badge = card.querySelector('.badge').textContent.toLowerCase();

        const matchesFilter = activeFilter === 'all' || categories.includes(activeFilter);
        const matchesSearch = !searchTerm ||
                            title.includes(searchTerm) ||
                            excerpt.includes(searchTerm) ||
                            badge.includes(searchTerm);

        card.style.display = (matchesFilter && matchesSearch) ? 'block' : 'none';
      });

      const visibleCards = Array.from(blogCards).filter(card =>
        card.style.display !== 'none');
      document.getElementById('noResults').style.display =
        visibleCards.length === 0 ? 'block' : 'none';
    };

    // Search functionality
    let searchTimeout;
    blogSearch.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyBlogFilters();
      }, 300);
    });

    // Filter functionality
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        applyBlogFilters();
      });
    });
  }


});


/**
 * 7. Analytics Events (GA4 + Clarity)
 * ==================================================================
 * Sends named events so GA4 shows what visitors DO, not just page views.
 * Everything is guarded: if an ad blocker removes gtag or Clarity,
 * nothing breaks. Event names follow GA4 conventions where one exists.
 * Mark "generate_lead" as a Key Event in GA4 (Admin > Events).
 * ==================================================================
 */
(() => {
  const page = location.pathname.replace(/\/index\.html$/, '/') || '/';
  const pageType = page.includes('/articles/') ? 'article'
    : page.includes('/dashboards/') ? 'dashboard'
    : page.includes('/tools/') ? 'tool'
    : page.replace(/^\//, '').replace('.html', '') || 'home';

  const track = (name, params = {}) => {
    const payload = { page_type: pageType, ...params };
    try { if (typeof window.gtag === 'function') window.gtag('event', name, payload); } catch (e) { /* ignore */ }
    try { if (typeof window.clarity === 'function') window.clarity('event', name); } catch (e) { /* ignore */ }
  };
  window.dataArcusTrack = track; // lets tool pages send their own events

  const once = new Set();
  const trackOnce = (key, name, params) => { if (once.has(key)) return; once.add(key); track(name, params); };

  // --- Leads: fired by the form handler in section 5 after a successful send
  document.addEventListener('dataarcus:lead', (e) => {
    track('generate_lead', { form_id: (e.detail && e.detail.formId) || 'unknown' });
  });

  // --- Form funnel: first interaction with a form (started but maybe not sent)
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('focusin', () => trackOnce('form_start:' + form.id, 'form_start', { form_id: form.id || 'form' }), { once: true });
  });

  // --- Clicks: CTAs, email/phone/WhatsApp, outbound links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const text = (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 60);

    if (/^mailto:/i.test(href)) return track('contact_click', { method: 'email', link_text: text });
    if (/^tel:/i.test(href)) return track('contact_click', { method: 'phone', link_text: text });
    if (/wa\.me|whatsapp\.com/i.test(href)) return track('contact_click', { method: 'whatsapp', link_text: text });

    if (/#contact\b/.test(href) || a.classList.contains('btn-accent')) {
      return track('cta_click', { cta_text: text, cta_target: href });
    }

    try {
      const url = new URL(href, location.href);
      if (url.hostname && url.hostname !== location.hostname && /^https?:$/.test(url.protocol)) {
        track('outbound_click', { link_domain: url.hostname.replace(/^www\./, ''), link_url: url.href.slice(0, 100), link_text: text });
      }
    } catch (err) { /* ignore bad URLs */ }
  }, { capture: true });

  // --- Dashboards: a click into the Power BI iframe blurs the window.
  //     Page loads alone don't count; this means someone actually used it.
  const pbiFrames = document.querySelectorAll('iframe[src*="powerbi.com"]');
  if (pbiFrames.length) {
    const title = document.title.replace(/\s*-\s*DataArcus\s*$/, '');
    trackOnce('dash_view', 'dashboard_view', { dashboard: title });
    window.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
          trackOnce('dash_engage', 'dashboard_engage', { dashboard: title });
        }
      }, 0);
    });
  }

  // --- Articles: "read" = 75% scrolled AND 30 seconds on the page
  if (pageType === 'article') {
    const article = document.title.replace(/\s*-\s*DataArcus\s*$/, '');
    let deepScroll = false, longEnough = false;
    const check = () => { if (deepScroll && longEnough) trackOnce('read', 'article_read', { article }); };
    setTimeout(() => { longEnough = true; check(); }, 30000);
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop + window.innerHeight) / h.scrollHeight;
      if (pct >= 0.75) { deepScroll = true; check(); window.removeEventListener('scroll', onScroll); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- Language switch: watch the <html lang> attribute the language manager sets
  let lastLang = document.documentElement.lang;
  new MutationObserver(() => {
    const lang = document.documentElement.lang;
    if (lang && lang !== lastLang) { lastLang = lang; track('language_switch', { language: lang }); }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // --- Blog: what people search for and which filters they use
  const blogSearch = document.getElementById('blogSearch');
  if (blogSearch) {
    let t;
    blogSearch.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { const q = blogSearch.value.trim(); if (q.length >= 3) track('search', { search_term: q.slice(0, 50) }); }, 1500);
    });
  }
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => track('blog_filter', { filter: btn.getAttribute('data-filter') }));
  });
})();


/**
 * 8. WhatsApp Button
 * ==================================================================
 * A small floating chat button on every page. The pre-filled message
 * follows the page language. Clicks are counted by section 7 as
 * contact_click (method: whatsapp).
 * ==================================================================
 */
(() => {
  const NUMBER = '971506583577';
  const a = document.createElement('a');
  a.className = 'wa-float';
  a.target = '_blank';
  a.rel = 'noopener';
  a.innerHTML = '<i class="bi bi-whatsapp" aria-hidden="true"></i>';
  const texts = () => {
    const all = window.commonTranslations || {};
    const t = (all[document.documentElement.lang === 'ar' ? 'ar' : 'en'] || {}).wa || {};
    a.href = 'https://wa.me/' + NUMBER + (t.message ? '?text=' + encodeURIComponent(t.message) : '');
    a.setAttribute('aria-label', t.label || 'WhatsApp');
    a.title = t.label || 'WhatsApp';
  };
  texts();
  document.body.appendChild(a);
  new MutationObserver(texts).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
