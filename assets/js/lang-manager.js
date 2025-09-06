// lang-manager.js - Enhanced Language Management System
class LanguageManager {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.rtlLanguages = ['ar', 'he', 'fa'];
    this.translations = {};
    this.initialized = false;
    this.breakpoint = 992; // Bootstrap's lg breakpoint
  }
  
  // Detect browser/stored language preference
  detectLanguage() {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && ['en', 'ar'].includes(langParam)) {
      return langParam;
    }
    
    // Check localStorage
    const stored = localStorage.getItem('dataarcus-lang');
    if (stored && ['en', 'ar'].includes(stored)) {
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
  
  // Get page-specific translations based on current page
  getPageTranslations() {
    const path = window.location.pathname;
    
    if (path.includes('adventureworks-dashboard')) {
      return window.adventureworksTranslations;
    } else if (path.includes('call-center-dashboard')) {
      return window.callcenterTranslations;
    } else if (path.includes('maven-market-dashboard')) {
      return window.mavenmarketTranslations;
    } else if (path.includes('portfolio.html')) {
      return window.portfolioTranslations;
    } else if (path.includes('index.html') || path === '/' || path === '') {
      return window.homepageTranslations;
    } else if (path.includes('article-clv.html')) {
      return window.articleTranslations;
    } else if (path.includes('er-health-dashboard')) {
     return window.erHealthTranslations;
    } else if (path.includes('blog')) {
     return window.blogTranslations;
    } else if (path.includes('article-etl-vs-power-query')) {
     return window.etlpqTranslations;
    }
    return null;
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
    if (!['en', 'ar'].includes(lang)) return false;
    
    this.currentLang = lang;
    localStorage.setItem('dataarcus-lang', lang);
    
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
  
  // Apply translations to DOM elements
  applyLanguage() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
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
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      const html = this.getText(key);
      if (typeof html === 'string') {
        element.innerHTML = html;
      }
    });
    
    // Update meta tags
    this.updateMetaTags();
    
    // Trigger custom event for page-specific updates
    document.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: this.currentLang } 
    }));
  }
  
  // Update meta tags for SEO
  updateMetaTags() {
    const metaData = this.getText('meta');
    
    if (typeof metaData === 'object') {
      // Update title
      if (metaData.title) {
        document.title = metaData.title;
      }
      
      // Update description
      if (metaData.description) {
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) {
          descMeta.content = metaData.description;
        }
      }
      
      // Update keywords
      if (metaData.keywords) {
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (keywordsMeta) {
          keywordsMeta.content = metaData.keywords;
        }
      }
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
      '.lang-switcher-simple, .language-switcher-container, .desktop-lang-switcher'
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
        <button class="lang-btn" type="button" aria-label="Switch language">
          <i class="bi bi-globe2"></i>
          <span class="lang-text">${this.currentLang.toUpperCase()}</span>
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
        <button class="nav-link lang-btn-desktop" type="button" aria-label="Switch language">
          <i class="bi bi-globe2 me-1"></i>
          ${this.currentLang.toUpperCase()}
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
    const mobileText = document.querySelector('.lang-text');
    const desktopButton = document.querySelector('.lang-btn-desktop');
    
    if (mobileText) {
      mobileText.textContent = this.currentLang.toUpperCase();
    }
    
    if (desktopButton) {
      const icon = desktopButton.querySelector('i');
      desktopButton.innerHTML = '';
      if (icon) {
        desktopButton.appendChild(icon);
        desktopButton.appendChild(document.createTextNode(` ${this.currentLang.toUpperCase()}`));
      } else {
        desktopButton.innerHTML = `<i class="bi bi-globe2 me-1"></i> ${this.currentLang.toUpperCase()}`;
      }
    }
  }

  /**
   * Core language switching logic
   */
  toggleLanguage() {
    const newLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }
  
  // Initialize the language manager
  init() {
    this.loadTranslations();
    this.updateDirection();
    this.applyLanguage();
    this.createLanguageSwitcher();
    this.initialized = true;
    
    console.log('LanguageManager initialized with language:', this.currentLang);
    console.log('Mobile view:', this.isMobileView());
    console.log('Breakpoint:', this.breakpoint);
  }

  // Cleanup method
  destroy() {
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
    this.removeSwitchers();
  }
}

// Global utility function for getting translations
function t(key) {
  return window.langManager ? window.langManager.getText(key) : key;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a tick to ensure all translation files are loaded
  setTimeout(() => {
    window.langManager = new LanguageManager();
    window.langManager.init();
  }, 10);
});