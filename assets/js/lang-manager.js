// lang-manager.js - the language manager: it detects the visitor's language (an Arabic copy's address, then ?lang=,
// then the saved choice, then the browser's), saves an explicit choice, builds the switcher and puts the pieces
// together: the locales and page routes (locale-routes.js, loaded before it)
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
  
  // Load and merge translation files
  loadTranslations() {
    // Merge common translations
    if (window.commonTranslations) {
      this.translations = { ...window.commonTranslations };
    }
    
    // Merge page-specific translations
    const pageTranslations = this.getPageTranslations();
    if (pageTranslations) {
      this.mergeTranslations(pageTranslations);
    }
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
    const base = window.location.origin + this.pagePath();
    root.querySelectorAll('[href], [src]').forEach((e) => ['href', 'src'].forEach((a) => {
      const v = e.getAttribute(a);
      if (v === null) return;
      const to = window.LocaleRoutes.arAddress(v, a === 'href' && e.tagName === 'A', base);
      if (to !== null) e.setAttribute(a, to);
    }));
  }

  // The page's own translations: the window global its route names (locale-routes.js)
  getPageTranslations() {
    const key = window.LocaleRoutes.pageKey(this.pagePath());
    return key ? window[key] : null;
  }

  // Deep merge translations
  mergeTranslations(pageTranslations) {
    for (const lang in pageTranslations) {
      if (!this.translations[lang]) {
        this.translations[lang] = {};
      }
      this.translations[lang] = this.deepMerge(
        this.translations[lang], 
        pageTranslations[lang]
      );
    }
  }
  
  // Deep merge utility function
  deepMerge(target, source) {
    const output = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    
    return output;
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
    const isRTL = this.rtlLanguages.includes(this.currentLang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLang;
    
    // Arabic font: Inter has no Arabic letters, so load IBM Plex Sans Arabic on demand
    if (isRTL && !document.getElementById('ar-font')) {
      const font = document.createElement('link');
      font.id = 'ar-font';
      font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap';
      document.head.appendChild(font);
    }
    // English pages still show Arabic words: the switcher's label. Without the Arabic font the phone draws them
    // in its own system font, which sits lower than the icon. Load only the letters of those words (a few KB).
    if (!isRTL && !document.getElementById('ar-font-label')) {
      const label = document.createElement('link');
      label.id = 'ar-font-label';
      label.rel = 'stylesheet';
      label.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;600&display=swap&text=' + encodeURIComponent('عربي العربية');
      document.head.appendChild(label);
    }

    // Add/remove RTL class
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }
  
  // Get translation text by key path
  getText(path) {
    const keys = path.split('.');
    let value = this.translations[this.currentLang];
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        console.warn(`Translation missing: ${path} for language: ${this.currentLang}`);
        return `[Missing: ${path}]`;
      }
    }
    
    return value || `[Missing: ${path}]`;
  }
  
  // Apply translations to DOM elements (of this page, or of another document: scripts/ar-pages.mjs translates the page's
  // own HTML with it to write the /ar/ copy)
  // (arCopy: the document is an Arabic copy; the generator passes it, as it translates from the English address)
  applyLanguage(doc = document, arCopy = window.LocaleRoutes.isArPath(window.location.pathname)) {
    // Update all elements with data-i18n attribute
    doc.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = this.getText(key);
      
      if (typeof text === 'string') {
        if (element.tagName === 'INPUT' && element.type === 'submit') {
          element.value = text;
        } else if (element.hasAttribute('placeholder')) {
          element.placeholder = text;
        } else {
          element.textContent = text;
        }
      }
    });
    
    // Update elements with data-i18n-html for HTML content
    doc.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      const html = this.getText(key);
      if (typeof html === 'string') {
        element.innerHTML = html;
        if (arCopy) this.arLinks(element);
      }
    });
    
    // Translate attributes: data-i18n-placeholder, data-i18n-alt, data-i18n-aria-label and data-i18n-title
    // each name the key for that attribute, so inputs, images and buttons read in the page's language too
    ['placeholder', 'alt', 'aria-label', 'title'].forEach((attr) => {
      doc.querySelectorAll(`[data-i18n-${attr}]`).forEach((element) => {
        const text = this.getText(element.getAttribute(`data-i18n-${attr}`));
        if (typeof text === 'string') element.setAttribute(attr, text);
      });
    });

    // Update meta tags
    this.updateMetaTags(doc);
  }
  
  // Update meta tags for SEO
  updateMetaTags(doc = document) {
    // pages without their own translation file (404) name their meta key on <html data-i18n-meta="...">
    const found = this.getText(doc.documentElement.getAttribute('data-i18n-meta') || 'meta');
    if (typeof found === 'object') {
      // Share previews follow the page: og:/twitter: title and description default to the page's own, and
      // og:locale to its language, so a page only needs a title and a description in each language
      const metaData = Object.assign({}, found);
      const has = (sel) => !!doc.querySelector(sel);
      [['title', 'og:title', 'twitter:title'], ['description', 'og:description', 'twitter:description']].forEach(([base, og, tw]) => {
        if (!metaData[base]) return;
        if (!metaData[og] && has(`meta[property="${og}"]`)) metaData[og] = metaData[base];
        if (!metaData[tw] && has(`meta[name="${tw}"]`)) metaData[tw] = metaData[og] || metaData[base];
      });
      if (has('meta[property="og:locale"]')) metaData['og:locale'] = this.currentLang === 'ar' ? 'ar_AE' : 'en_US';
      // Update <title>
      if (metaData.title) {
        doc.title = metaData.title;
      }
      // a page with its own Arabic copy (hreflang links) has its canonical in its file: each copy names itself
      if (doc.querySelector('link[rel="alternate"][hreflang]')) delete metaData.canonical;

      // Loop through all meta properties
      Object.entries(metaData).forEach(([key, value]) => {
        if (!value) return;
        if (key === 'title') return; // Already handled

        // Handle standard meta tags
        let selector, attr;
        if (key === 'description' || key === 'keywords' || key === 'author') {
          selector = `meta[name="${key}"]`;
          attr = 'content';
        }
        // Handle Open Graph tags
        else if (key.startsWith('og:')) {
          selector = `meta[property="${key}"]`;
          attr = 'content';
        }
        // Handle Twitter tags
        else if (key.startsWith('twitter:')) {
          selector = `meta[name="${key}"]`;
          attr = 'content';
        }
        // Handle canonical link
        else if (key === 'canonical') {
          selector = 'link[rel="canonical"]';
          attr = 'href';
        }
        // Handle favicon
        else if (key === 'icon') {
          selector = 'link[rel="icon"]';
          attr = 'href';
        }
        // Add more custom cases as needed

        if (selector) {
          let tag = doc.querySelector(selector);
          if (!tag) {
            // Create tag if it doesn't exist
            if (selector.startsWith('meta')) {
              tag = doc.createElement('meta');
              if (selector.includes('property')) {
                tag.setAttribute('property', key);
              } else if (selector.includes('name')) {
                tag.setAttribute('name', key);
              }
              doc.head.appendChild(tag);
            } else if (selector.startsWith('link')) {
              tag = doc.createElement('link');
              if (key === 'canonical') tag.setAttribute('rel', 'canonical');
              if (key === 'icon') tag.setAttribute('rel', 'icon');
              doc.head.appendChild(tag);
            }
          }
          tag.setAttribute(attr, value);
        }
      });
    }
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