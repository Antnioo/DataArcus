// lang-manager.js - Core Language Management System
class LanguageManager {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.rtlLanguages = ['ar', 'he', 'fa'];
    this.translations = {};
    this.initialized = false;
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
  
  // Create and inject language switcher
  createLanguageSwitcher() {
    // UPDATED: Target the main navbar collapse container
    const navCollapse = document.querySelector('#navmenu');
    if (!navCollapse) return;

    const switcherHTML = `
      <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" 
         data-bs-toggle="dropdown" aria-expanded="false" style="color: rgba(255,255,255,0.8);">
        <i class="bi bi-globe2 me-2"></i>
        <span class="current-lang">${this.currentLang.toUpperCase()}</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end language-dropdown">
        <li>
          <button class="dropdown-item lang-option ${this.currentLang === 'en' ? 'active' : ''}" data-lang="en">
            <span class="lang-flag">🇺🇸</span>
            <span class="lang-name">English</span>
          </button>
        </li>
        <li>
          <button class="dropdown-item lang-option ${this.currentLang === 'ar' ? 'active' : ''}" data-lang="ar">
            <span class="lang-flag">🇸🇦</span>
            <span class="lang-name">العربية</span>
          </button>
        </li>
      </ul>
    `;

    // Create a new div wrapper for the dropdown
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-item dropdown ms-lg-3'; // Added margin for spacing
    wrapper.innerHTML = switcherHTML;

    // UPDATED: Append it to the end of the entire nav container
    navCollapse.appendChild(wrapper);

    // Manually initialize the new Bootstrap dropdown
    const dropdownToggle = wrapper.querySelector('[data-bs-toggle="dropdown"]');
    if (dropdownToggle) {
      new bootstrap.Dropdown(dropdownToggle);
    }
    
    this.setupLanguageSwitchingEvents();
  }
  
  // Setup language switching event listeners
  setupLanguageSwitchingEvents() {
    const langOptions = document.querySelectorAll('.lang-option');
    const currentLangSpan = document.querySelector('.current-lang');
    
    langOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        
        const selectedLang = option.getAttribute('data-lang');
        
        // Add switching animation
        document.body.classList.add('language-switching');
        
        // Update language
        if (this.setLanguage(selectedLang)) {
          // Update active state
          langOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
          
          // Update current language display
          if (currentLangSpan) {
            currentLangSpan.textContent = selectedLang.toUpperCase();
          }
          
          // Remove switching animation after short delay
          setTimeout(() => {
            document.body.classList.remove('language-switching');
          }, 300);
        }
      });
    });
  }
  
  // Initialize the language manager
  init() {
    this.loadTranslations();
    this.updateDirection();
    this.applyLanguage();
    this.createLanguageSwitcher();
    this.initialized = true;
    
    console.log('LanguageManager initialized with language:', this.currentLang);
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

// Add CSS for language switcher and RTL support
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Language Switcher Styling */
    .language-dropdown {
      background: var(--dk-2);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 0.5rem 0;
      min-width: 160px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    .lang-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      color: rgba(255, 255, 255, 0.8);
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      transition: all 0.3s ease;
    }

    .lang-option:hover {
      background: rgba(0, 212, 255, 0.1);
      color: white;
    }

    .lang-option.active {
      background: rgba(0, 212, 255, 0.2);
      color: var(--accent);
    }

    .lang-flag {
      font-size: 1.1em;
      width: 20px;
      text-align: center;
    }

    .lang-name {
      font-weight: 500;
    }

    .current-lang {
      font-size: 0.9em;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    /* Globe icon styling */
    .nav-link .bi-globe2 {
      font-size: 1.1em;
      opacity: 0.8;
    }

    .nav-link:hover .bi-globe2 {
      opacity: 1;
      color: var(--accent);
    }

    /* RTL Support */
    .rtl .navbar-nav {
      margin-left: auto;
      margin-right: 0;
    }

    .rtl .ms-lg-3 {
      margin-left: 0 !important;
      margin-right: 1rem !important;
    }

    .rtl .dropdown-menu-end {
      right: auto;
      left: 0;
    }

    .rtl .lang-option {
      text-align: right;
      flex-direction: row-reverse;
    }

    /* Language switching animation */
    .language-switching [data-i18n] {
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    /* Mobile optimization */
    @media (max-width: 991.98px) {
      .language-dropdown {
        position: static;
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
      }
      
      .lang-option {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--glass-border);
      }
      
      .lang-option:last-child {
        border-bottom: none;
      }
    }
  `;
  document.head.appendChild(style);
});