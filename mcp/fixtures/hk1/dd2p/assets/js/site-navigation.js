/*
 * DataArcus site navigation and effects (0.3.2 SP35: main.js sections 1 to 4, 6 and 8, and the live report facade).
 *
 * Interface: window.SiteNavigation, two functions, no state shared between them, no return values.
 *   init()      main.js calls it on DOMContentLoaded. In: the page's DOM; window.AOS and window.bootstrap when they
 *               loaded; the visitor's reduced-motion setting and viewport width. Out: DOM changes only (particles, AOS,
 *               the footer year, the navbar's scrolled class, the CSS variables --nav-h and --pin-h, the smooth-scroll
 *               class after a #section arrival, the counters, the phone menu closed by an in-page link, an outside
 *               click or Escape, the button ripple, the blog's search and filters, the live report facades) and one
 *               event per facade opened: document 'dataarcus:embed', detail { dashboard } (the page's title without
 *               " - DataArcus"; nothing else).
 *   whatsapp()  main.js calls it once at script time. In: window.commonTranslations (wa.message, wa.label) and
 *               <html lang>. Out: the floating WhatsApp button in an <aside>, its texts following the language.
 * It calls no tracker and reads no consent (scripts/tests/sp35.mjs M2): counting clicks, leads and live reports is
 * site-analytics.js, from the events and the clicks it hears.
 */
window.SiteNavigation = (() => {
  const init = () => {
    // --- Showcases: the live Power BI report (about 6 MB) loads when the visitor clicks its preview (audit AUD-020);
    //     the iframe gets the preview's alt text as its title and takes the focus; analytics hears of it by the event
    //     'dataarcus:embed' (the dashboard's title only) and counts it once
    document.querySelectorAll('[data-pbi-src]').forEach((f) => {
      const b = f.querySelector('button'); if (!b) return;
      b.addEventListener('click', () => {
        const img = f.querySelector('img'), frame = document.createElement('iframe');
        frame.src = f.dataset.pbiSrc; frame.title = (img && img.alt) || 'Power BI report';
        frame.setAttribute('allowfullscreen', 'true'); frame.setAttribute('frameborder', '0');
        f.replaceChildren(frame); frame.focus();
        document.dispatchEvent(new CustomEvent('dataarcus:embed', { detail: { dashboard: document.title.replace(/\s*-\s*DataArcus\s*$/, '') } }));
      });
    });

    /**
     * 1. Initialization & Core Setup
     * Handles the initial setup of the page, including the loading screen,
     * background particles, AOS library, and dynamic footer year.
     */

    // Respect the OS-level "reduce motion" setting: skip purely decorative
    // JS-driven animation (particles, AOS) for anyone who has it on.
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

    // Initialize Animate on Scroll (AOS) library only on desktop.
    // If the library did not load (blocked or offline), show the content instead of
    // leaving it hidden, and carry on with the rest of this file.
    if (window.AOS) {
      if (isDesktopViewport) {
        AOS.init({
          once: true,
          duration: prefersReducedMotion ? 0 : 800,
          easing: 'ease-out-cubic',
          disable: prefersReducedMotion
        });
        // AOS measures where each element sits once. When the page changes height (a filter or the search hides
        // cards, a section opens, a form shows its result), it measures again, so an element it has not revealed yet
        // never stays invisible in view (the owner, 14 Oct 2026: the blog's filters showed an empty page).
        if ('ResizeObserver' in window) {
          let refresh;
          new ResizeObserver(() => { clearTimeout(refresh); refresh = setTimeout(() => AOS.refresh(), 100); }).observe(document.body);
        }
      }
    } else {
      document.querySelectorAll('[data-aos]').forEach((el) => el.removeAttribute('data-aos'));
    }

    // Update year in footer
    const yearElement = document.getElementById('year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }


  /**
     * 2. Navigation & Scrolling
     * ==================================================================
     * Scrolling is native (CSS scroll-padding-top); this section only measures
     * the navbar and pinned bars into --nav-h and --pin-h
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

    // Top offset: measure what covers the top of the screen and publish it as CSS
    // variables (see :root in style.css). In-page links then scroll natively:
    // the browser's scroll-padding-top keeps targets below the navbar and pinned bars.
    const root = document.documentElement;
    const measureTop = () => {
      if (navbar) {
        let h = navbar.offsetHeight;
        // on phones an open menu makes the navbar taller; only the bar itself counts
        const menu = navbar.querySelector('.navbar-collapse');
        if (menu && window.innerWidth < 992 && menu.offsetHeight) h -= menu.offsetHeight;
        root.style.setProperty('--nav-h', h + 'px');
      }
      const pins = [...document.querySelectorAll('[data-pin]')].reduce((a, el) => a + el.offsetHeight, 0);
      root.style.setProperty('--pin-h', pins + 'px');
    };
    measureTop();
    window.addEventListener('resize', measureTop);
    window.addEventListener('load', measureTop);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(measureTop);
      document.querySelectorAll('[data-pin]').forEach((el) => ro.observe(el));
    }

    // Close the phone menu after tapping an in-page link
    document.addEventListener('click', (e) => {
      if (!e.target.closest('a[href^="#"]')) return;
      const navmenu = document.querySelector('#navmenu');
      if (navmenu && navmenu.classList.contains('show') && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(navmenu, { toggle: false }).hide();
    });

    // Arriving with #section in the address: images and translations can still move the
    // target after the browser's jump, so keep it in place until the page settles
    // (at most 2.5 s, and never after the visitor scrolls themselves). Then smooth scrolling starts.
    const target = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) {
      let done = false;
      const land = () => { if (!done) target.scrollIntoView({ behavior: 'instant', block: 'start' }); };
      const stop = () => { if (done) return; done = true; ro && ro.disconnect(); root.classList.add('smooth-scroll'); };
      const ro = 'ResizeObserver' in window ? new ResizeObserver(land) : null;
      if (ro) ro.observe(document.body);
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.addEventListener(ev, stop, { once: true, passive: true }));
      window.addEventListener('load', () => { land(); setTimeout(() => { land(); stop(); }, 2500); });
      land();
    } else {
      root.classList.add('smooth-scroll');
    }


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

      const animateCounter = (counter) => {
        {
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
        }
      };

      // Each number starts when it comes into view. Watching the whole section instead never fired on short
      // screens (a phone held sideways), where a tall section can never be 20% visible at once. 0.9, not 1: layout
      // heights are fractional (a 25.6px line), so a number scrolled to the screen edge can stay at 0.99 visible.
      const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.9 });

      // The HTML holds the final numbers (what search engines, link previews and a browser without JavaScript show);
      // with the script running, each starts at 0 and counts up when it comes into view.
      statsSection.querySelectorAll('[data-count]').forEach((counter) => { counter.textContent = '0'; statsObserver.observe(counter); });
    }

    // Scroll-in animations come from AOS only (data-aos attributes, section 1)



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
          // the excerpt paragraph, not the first .text-white-50 (that is the date line, so every month name matched)
          const excerpt = (card.querySelector('p') || { textContent: '' }).textContent.toLowerCase();
          // the card's topic label (searching "dax" or "ramadan" finds its cards)
          const badge = (card.querySelector('.topic-badge') || { textContent: '' }).textContent.toLowerCase();

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
  };

  // 8. WhatsApp Button: a small floating chat button on every page; the pre-filled message follows the page
  // language. Clicks are counted by site-analytics.js as contact_click (method: whatsapp).
  const whatsapp = () => {
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
    // inside a landmark (an aside), so screen-reader users find it with the page's regions
    const box = document.createElement('aside'); box.setAttribute('aria-label', 'WhatsApp'); box.appendChild(a);
    document.body.appendChild(box);
    new MutationObserver(texts).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  };

  return { init, whatsapp };
})();
