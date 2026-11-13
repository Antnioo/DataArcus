// lang-manager.js - the language manager (window.langManager): the orchestration. It detects the visitor's language
// (an Arabic copy's address, then ?lang=, then the saved choice, then the browser's), saves an explicit choice
// (storage, ?lang= and history), builds the switcher, switches (to the other language's own address when the page has
// one, in place otherwise) and puts the pieces together, each loaded before it (0.3.2 SP36):
//   locale-routes.js   the locales, the Arabic copy's paths, the page-route table, the other language's address
//   locale-catalog.js  the dictionaries loaded and merged, a key looked up
//   locale-dom.js      the translated elements, the Arabic copy's links, the direction and the meta tags
// Its methods keep their names (scripts/ar-pages.mjs calls applyLanguage, switcherAria, switcherLabel); the ones above
// are one-line calls into those modules.
class LanguageManager {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.rtlLanguages = [...window.LocaleRoutes.RTL];
    this.translations = {};
    this.initialized = false;
    this.breakpoint = 992; // Bootstrap's lg breakpoint
  }
  
  // Detect browser/stored language preference
  detectLanguage() {
    // An Arabic copy (/ar/...) is Arabic whatever was saved before: its address is its language. Saved, like ?lang=ar,
    // so the English-only pages it links to open in Arabic too
    if (window.LocaleRoutes.isArPath(window.location.pathname)) {
      try { localStorage.setItem('dataarcus-lang', 'ar'); } catch (e) {}
      return 'ar';
    }

    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && window.LocaleRoutes.LANGS.includes(langParam)) {
      // Save it, so the next page opens in the language this page shows
      try { localStorage.setItem('dataarcus-lang', langParam); } catch (e) {}
      return langParam;
    }
    
    // Check localStorage
    let stored = null;
    try { stored = localStorage.getItem('dataarcus-lang'); } catch (e) { /* storage blocked: fall back to the browser language */ }
    if (stored && window.LocaleRoutes.LANGS.includes(stored)) {
      return stored;
    }
    
    // Check browser language for Arabic
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'ar') {
      return 'ar';
    }
    
    // Default to English
    return 'en';
  }
  
  // Load and merge translation files: the common dictionary, then the page's own over it (locale-catalog.js)
  loadTranslations() {
    this.translations = window.LocaleCatalog.load(window.commonTranslations, this.getPageTranslations(), this.translations);
  }

  // The page's own path, whether a path has an Arabic copy (locale-routes.js)
  pagePath() {
    return window.LocaleRoutes.pagePath(window.location.pathname);
  }

  hasArCopy(p) {
    return window.LocaleRoutes.hasArCopy(p);
  }

  // Links in translated HTML on an Arabic copy: each address as locale-routes.js's arAddress gives it
  arLinks(root) {
    window.LocaleDom.arLinks(root, window.location.origin + this.pagePath());
  }

  // The page's own translations: the window global its route names (locale-routes.js)
  getPageTranslations() {
    const key = window.LocaleRoutes.pageKey(this.pagePath());
    return key ? window[key] : null;
  }

  // Deep merge translations (locale-catalog.js)
  mergeTranslations(pageTranslations) {
    this.translations = window.LocaleCatalog.merge(this.translations, pageTranslations);
  }

  deepMerge(target, source) {
    return window.LocaleCatalog.deepMerge(target, source);
  }

  // Set language and persist
  setLanguage(lang) {
    if (!window.LocaleRoutes.LANGS.includes(lang)) return false;
    
    this.currentLang = lang;
    try { localStorage.setItem('dataarcus-lang', lang); } catch (e) { /* storage blocked: the ?lang= in the URL still carries it */ }
    
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    
    this.applyLanguage();
    this.updateDirection();
    this.updateSwitcherText();
    return true;
  }
  
  // Update text direction and HTML attributes
  updateDirection() {
    window.LocaleDom.direction(this.currentLang, this.rtlLanguages);
  }
  
  // Get translation text by key path (locale-catalog.js; a path through a text warns in the console)
  getText(path) {
    return window.LocaleCatalog.text(this.translations, this.currentLang, path, (m) => console.warn(m));
  }

  // Apply translations to DOM elements (of this page, or of another document: scripts/ar-pages.mjs translates the page's
  // own HTML with it to write the /ar/ copy)
  // (arCopy: the document is an Arabic copy; the generator passes it, as it translates from the English address)
  applyLanguage(doc = document, arCopy = window.LocaleRoutes.isArPath(window.location.pathname)) {
    window.LocaleDom.translate(doc, { text: (k) => this.getText(k), lang: this.currentLang, arCopy, base: window.location.origin + this.pagePath() });
  }
  
  // Update meta tags for SEO
  updateMetaTags(doc = document) {
    window.LocaleDom.meta(doc, (k) => this.getText(k), this.currentLang);
  }
  
  // Check if current screen size is mobile (below breakpoint)
  isMobileView() {
    return window.innerWidth < this.breakpoint;
  }
  
  /**
   * Creates the language switcher button with improved responsive handling
   */
  createLanguageSwitcher() {
    // Remove any existing switchers to prevent duplicates
    this.removeSwitchers();

    // Only create mobile switcher if we're in mobile view
    if (this.isMobileView()) {
      this.createMobileSwitcher();
    } else {
      this.createDesktopSwitcher();
    }

    // Listen for window resize to recreate switcher if needed
    this.setupResizeListener();
  }

  /**
   * Remove all existing language switchers
   */
  removeSwitchers() {
    const existingSwitchers = document.querySelectorAll(
      '.language-switcher-container, .desktop-lang-switcher'
    );
    existingSwitchers.forEach(switcher => switcher.remove());
  }

  /**
   * Create mobile language switcher (next to hamburger)
   */
  createMobileSwitcher() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    if (!navbarToggler) {
      console.error("Navbar Toggler not found. Cannot create mobile language switcher.");
      return;
    }

    const switcherHTML = `
      <div class="language-switcher-container">
        <button class="lang-btn" type="button" aria-label="${this.switcherAria()}">
          <i class="bi bi-globe2"></i>
          <span class="lang-text" lang="${this.otherLang()}">${this.switcherLabel(true)}</span>
        </button>
      </div>
    `;

    navbarToggler.insertAdjacentHTML('beforebegin', switcherHTML);
    this.setupSwitcherEvents();
  }

  /**
   * Create desktop language switcher (in navbar menu)
   */
  createDesktopSwitcher() {
    const navbarNav = document.querySelector('.navbar-nav');
    if (!navbarNav) {
      console.error("Navbar nav not found. Cannot create desktop language switcher.");
      return;
    }

    const switcherHTML = `
      <li class="nav-item desktop-lang-switcher">
        <button class="nav-link lang-btn-desktop" type="button" aria-label="${this.switcherAria()}">
          <i class="bi bi-globe2 me-1"></i>
          <span lang="${this.otherLang()}">${this.switcherLabel(false)}</span>
        </button>
      </li>
    `;

    navbarNav.insertAdjacentHTML('beforeend', switcherHTML);
    this.setupDesktopSwitcherEvents();
  }

  /**
   * Setup resize listener to recreate switcher when crossing breakpoint
   */
  setupResizeListener() {
    // Debounce resize events to avoid excessive recreations
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const wasMobile = document.querySelector('.language-switcher-container') !== null;
        const isMobile = this.isMobileView();
        
        // Only recreate if we've crossed the breakpoint
        if (wasMobile !== isMobile) {
          this.createLanguageSwitcher();
        }
      }, 150);
    };

    // Remove existing listener if any
    window.removeEventListener('resize', this.handleResize);
    
    // Store reference for cleanup
    this.handleResize = handleResize;
    window.addEventListener('resize', handleResize);
  }

  /**
   * Enhanced mobile switcher events with better touch handling
   */
  setupSwitcherEvents() {
    const button = document.querySelector('.lang-btn');
    if (!button) return;

    // Prevent default touch behavior to avoid sticky highlights
    button.addEventListener('touchstart', (event) => {
      event.preventDefault();
    }, { passive: false });

    // Handle touch end for mobile
    button.addEventListener('touchend', (event) => {
      event.preventDefault();
      this.toggleLanguage();
    });

    // Handle click for non-touch devices
    button.addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleLanguage();
    });
  }

  /**
   * Desktop switcher events
   */
  setupDesktopSwitcherEvents() {
    const button = document.querySelector('.lang-btn-desktop');
    if (!button) return;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleLanguage();
      
      // Fix for focus outline
      button.blur();

      // New Fix: Forcefully remove the sticky :hover background by briefly
      // disabling and re-enabling pointer events. This makes the browser
      // remove the hover state.
      button.style.pointerEvents = 'none';
      setTimeout(() => {
        button.style.pointerEvents = 'auto';
      }, 50);
    });
  }

  /**
   * Update switcher text after language change
   */
  updateSwitcherText() {
    const mobileButton = document.querySelector('.lang-btn');
    const mobileText = document.querySelector('.lang-text');
    const desktopButton = document.querySelector('.lang-btn-desktop');
    
    if (mobileText) {
      mobileText.textContent = this.switcherLabel(true);
      mobileText.lang = this.otherLang();
    }
    if (mobileButton) mobileButton.setAttribute('aria-label', this.switcherAria());
    
    if (desktopButton) {
      desktopButton.innerHTML = `<i class="bi bi-globe2 me-1"></i> <span lang="${this.otherLang()}">${this.switcherLabel(false)}</span>`;
      desktopButton.setAttribute('aria-label', this.switcherAria());
    }
  }

  /**
   * The switcher names the language you switch TO, in its own script
   */
  otherLang() {
    return this.currentLang === 'en' ? 'ar' : 'en';
  }

  switcherLabel(short) {
    if (this.currentLang === 'en') return short ? 'عربي' : 'العربية';
    return short ? 'EN' : 'English';
  }

  switcherAria() {
    return this.currentLang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية';
  }

  /**
   * Core language switching logic
   */
  toggleLanguage() {
    const newLang = this.currentLang === 'en' ? 'ar' : 'en';
    // a page with an Arabic copy goes to the other language's own address (the hreflang link in its head); the
    // choice is saved first, or carried in ?lang= when storage is blocked (the English page would follow the
    // browser's language otherwise)
    const to = this.pairUrl(newLang);
    if (to) {
      let saved = true;
      try { localStorage.setItem('dataarcus-lang', newLang); } catch (e) { saved = false; }
      window.location.assign(saved || newLang === 'ar' ? to : to + '?lang=' + newLang);
      return;
    }
    this.setLanguage(newLang);
  }

  // The address of this page in another language, when it has its own copy there: <link rel="alternate" hreflang>
  // naming another path on this site (null for the page itself, so an English page shown in Arabic switches in place)
  pairUrl(lang) {
    const link = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
    return link ? window.LocaleRoutes.pairUrl(link.getAttribute('href'), window.location.href) : null;
  }

  // Initialize the language manager
  init() {
    this.loadTranslations();
    // Create the switcher first: it's the only step here that reads a
    // layout-dependent value (window.innerWidth, via isMobileView()).
    // Running it before the DOM-mutating steps below (which rewrite
    // textContent/innerHTML on every [data-i18n] element) avoids forcing
    // a synchronous layout recalculation mid-script.
    this.createLanguageSwitcher();
    this.updateDirection();
    this.applyLanguage();
    this.initialized = true;
    // Translations are in place: show the page (hidden by the early script in <head>). An Arabic page also waits for
    // its Arabic font (the head script loads it), at most 1.5 s, so its lines don't re-wrap in front of the reader
    // when the font arrives (audit AUD-002); the head script's 2 s limit stays as the safety net.
    const show = () => document.documentElement.classList.remove('i18n-pending');
    const link = this.currentLang === 'ar' && document.fonts && document.getElementById('ar-font');
    if (!link) { show(); return; }
    const css = link.sheet ? Promise.resolve() : new Promise((done) => { link.addEventListener('load', done); link.addEventListener('error', done); });
    // every weight the head script loads: the headings and buttons are 500-700, and when only 400 was waited for they
    // re-wrapped in front of the reader as the heavier files arrived (AUD-041: /ar/ jumped 0.24 at 1440)
    const weights = () => Promise.all(['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 1em "IBM Plex Sans Arabic"`, 'عربي Power BI')));
    Promise.race([css.then(weights), new Promise((done) => setTimeout(done, 1500))]).then(show, show);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a tick to ensure all translation files are loaded
  setTimeout(() => {
    window.langManager = new LanguageManager();
    window.langManager.init();
  }, 10);
});