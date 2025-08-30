// Premium DataArcus JavaScript
document.addEventListener('DOMContentLoaded', () => {

    // --- Interactive background particles (CORRECTED PLACEMENT) ---
  const interactiveBg = document.getElementById('interactiveBg');
  if (interactiveBg) {
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
      interactiveBg.appendChild(particle);
    }
  }
  // --- END of particle script ---

  // Hide loading overlay
  setTimeout(() => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => loadingOverlay.style.display = 'none', 500);
    }
  }, 1000);

  // Enhanced navbar scroll effect
  const nav = document.querySelector('.navbar');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
  }

  // Initialize AOS only on desktop
  if (window.innerWidth > 767) {
    AOS.init({
      once: true,
      duration: 800,
      easing: 'ease-out-cubic'
    });
  }

  // Counter animation for stats
  const animateCounters = () => {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-count'));
      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = 2000; // Animation duration in ms
      
      // Calculate how much to increment on each frame
      const step = target / (duration / 16); // Roughly 60 frames per second
      let current = 0;

      const updateCounter = () => {
        current += step;
        
        if (current >= target) {
          // Animation finished, set the final text
          counter.textContent = target + suffix;
        } else {
          // During animation, update the text
          if (target.toString().includes('.')) {
            // Handle decimal points like in 99.9
            counter.textContent = current.toFixed(1);
          } else {
            // Handle whole numbers
            counter.textContent = Math.floor(current);
          }
          // Request the next frame to continue the animation
          requestAnimationFrame(updateCounter);
        }
      };
      
      // Start the animation
      updateCounter();
    });
  };

  // Trigger counter animation when stats section is visible
  const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.querySelector('[data-count]')) {
        animateCounters();
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const statsSection = document.querySelector('#about');
  if (statsSection) observer.observe(statsSection);



  // --- Final, Professional Smooth Scrolling Script ---
  document.addEventListener('click', function(e) {
    // Find the closest link that was clicked
    const anchor = e.target.closest('a');

    // If no link was clicked, or it's not a hash link, do nothing
    if (!anchor || !anchor.getAttribute('href')?.startsWith('#')) {
      return;
    }
    
    // Get the target ID from the href
    const targetId = anchor.getAttribute('href');
    
    // If it's just a "#" link, do nothing (or scroll to top if you want)
    if (targetId === '#') {
      return;
    }
    
    // Find the target element on the current page
    const targetElement = document.querySelector(targetId);

    // If the target element actually exists on this page...
    if (targetElement) {
      // ...then, and only then, prevent the default jump and scroll smoothly.
      e.preventDefault();
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    // If the target element doesn't exist (e.g., a link on portfolio.html pointing to #services),
    // the script does nothing, and the browser handles the link normally.
  });

  // Enhanced hover effects for glass cards
  const addHoverEffects = () => {
    document.querySelectorAll('.glass-card').forEach(card => {
      card.addEventListener('mouseenter', function() {
        if (!this.classList.contains('portfolio-card')) {
          this.style.transform = 'translateY(-5px) scale(1.02)';
        }
      });
      
      card.addEventListener('mouseleave', function() {
        if (!this.classList.contains('portfolio-card')) {
          this.style.transform = 'translateY(0) scale(1)';
        }
      });
    });
  };

  addHoverEffects();

  // Update year in footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Mouse move parallax effect
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    document.querySelectorAll('.floating-element').forEach((element, index) => {
      const speed = (index + 1) * 0.5;
      const x = (mouseX - 0.5) * speed * 20;
      const y = (mouseY - 0.5) * speed * 20;
      element.style.transform = `translate(${x}px, ${y}px)`;
    });
  });

  // Enhanced tech icon interactions
  document.querySelectorAll('.tech-icon').forEach(icon => {
    icon.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.2) rotate(10deg)';
      this.style.filter = 'brightness(1.3) drop-shadow(0 0 20px currentColor)';
    });
    
    icon.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1) rotate(0deg)';
      this.style.filter = 'brightness(1)';
    });
  });

  // Service card tilt effect
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  // --- Final Combined Contact Form Script ---
  const contactForm = document.getElementById('contact-form');
  const formResult = document.getElementById('form-result');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const formButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonHtml = formButton.innerHTML;

      // 1. Change button to "Sending..." state
      formButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Sending...';
      formButton.disabled = true;
      
      // 2. Prepare form data and show "Please wait" message
      const formData = new FormData(contactForm);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);
      formResult.innerHTML = `<div class="alert alert-info mt-3">Please wait...</div>`;
      formResult.style.display = 'block';

      // 3. Submit the form to Web3Forms
      fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              body: json
          })
          .then(async (response) => {
              let jsonResponse = await response.json();
              if (response.status == 200) {
                  // Success
                  formResult.innerHTML = `<div class="alert alert-success mt-3">${jsonResponse.message}</div>`;
              } else {
                  // Error
                  console.log(response);
                  formResult.innerHTML = `<div class="alert alert-danger mt-3">${jsonResponse.message}</div>`;
              }
          })
          .catch(error => {
              // Network or other error
              console.log(error);
              formResult.innerHTML = `<div class="alert alert-danger mt-3">Something went wrong!</div>`;
          })
          .finally(() => {
              // 4. Reset button and form, then hide message
              formButton.innerHTML = originalButtonHtml;
              formButton.disabled = false;
              contactForm.reset();
              setTimeout(() => {
                  formResult.style.display = 'none';
              }, 6000); // Hide the message after 6 seconds
          });
    });
  }

  // Demo form handler
  const demoForm = document.getElementById('demo-form');
  const demoFormResult = document.getElementById('demo-form-result');

  if (demoForm) {
    demoForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const formButton = demoForm.querySelector('button[type="submit"]');
      const originalButtonHtml = formButton.innerHTML;

      // Change button state
      formButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Sending...';
      formButton.disabled = true;
      
      // Show waiting message
      const formData = new FormData(demoForm);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);
      demoFormResult.innerHTML = `<div class="alert alert-info mt-3">Sending demo request...</div>`;
      demoFormResult.style.display = 'block';

      // Submit to Web3Forms
      fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              body: json
          })
          .then(async (response) => {
              let jsonResponse = await response.json();
              if (response.status == 200) {
                  demoFormResult.innerHTML = `<div class="alert alert-success mt-3">Demo request sent! Check your email.</div>`;
              } else {
                  demoFormResult.innerHTML = `<div class="alert alert-danger mt-3">${jsonResponse.message}</div>`;
              }
          })
          .catch(error => {
              demoFormResult.innerHTML = `<div class="alert alert-danger mt-3">Something went wrong!</div>`;
          })
          .finally(() => {
              formButton.innerHTML = originalButtonHtml;
              formButton.disabled = false;
              demoForm.reset();
              setTimeout(() => {
                  demoFormResult.style.display = 'none';
              }, 5000);
          });
    });
  }

  // Portfolio card advanced hover effects
  document.querySelectorAll('.portfolio-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      const image = this.querySelector('.portfolio-image');
      if (image) {
        image.style.transform = 'scale(1.1)';
      }
    });
    
    card.addEventListener('mouseleave', function() {
      const image = this.querySelector('.portfolio-image');
      if (image) {
        image.style.transform = 'scale(1)';
      }
    });
  });

  // Dynamic gradient animation for CTA section
  const ctaSection = document.querySelector('.cta-section');
  if (ctaSection) {
    ctaSection.style.backgroundSize = '400% 400%';
    ctaSection.style.animation = 'gradient-shift 8s ease infinite';
  }

  // Enhanced button interactions
  document.querySelectorAll('.btn-accent').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.boxShadow = '0 15px 35px rgba(0, 212, 255, 0.5)';
      this.style.transform = 'translateY(-4px) scale(1.02)';
    });
    
    btn.addEventListener('mouseleave', function() {
      this.style.boxShadow = 'none';
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Intersection Observer for fade-in animations
  const fadeElements = document.querySelectorAll('.glass-card, .service-card, .portfolio-card');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  fadeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(el);
  });

  // Performance monitoring
  const logPerformance = () => {
    if (window.performance && window.performance.timing) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      console.log(`🚀 DataArcus loaded in ${loadTime}ms`);
    }
  };

  // Call performance logging after everything is loaded
  window.addEventListener('load', logPerformance);

  // Advanced scroll effects
  let ticking = false;
  const updateScrollEffects = () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    // Parallax effect for hero background
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.style.transform = `translate3d(0, ${rate}px, 0)`;
    }
    
    // Floating elements follow scroll
    document.querySelectorAll('.floating-element').forEach((el, index) => {
      const speed = 0.2 + (index * 0.1);
      el.style.transform += ` translateY(${scrolled * speed}px)`;
    });
    
    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollEffects);
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestScrollUpdate);

  // Keyboard navigation enhancement
  document.addEventListener('keydown', (e) => {
    // ESC key to close any modals or overlays
    if (e.key === 'Escape') {
      const navbar = document.querySelector('.navbar-collapse');
      if (navbar && navbar.classList.contains('show')) {
        bootstrap.Collapse.getInstance(navbar).hide();
      }
    }
  });

  // Add ripple effect to buttons
  const addRippleEffect = (button) => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.height, rect.width);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  };

  // Apply ripple effect to all buttons
  document.querySelectorAll('.btn').forEach(addRippleEffect);

  // Enhanced form validation
  const enhanceForm = () => {
    const formInputs = document.querySelectorAll('.form-control');
    
    formInputs.forEach(input => {
      // Add floating label effect
      input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });
      
      input.addEventListener('blur', function() {
        if (!this.value) {
          this.parentElement.classList.remove('focused');
        }
      });
      
      // Real-time validation
      input.addEventListener('input', function() {
        const isValid = this.checkValidity();
        this.classList.toggle('is-valid', isValid && this.value);
        this.classList.toggle('is-invalid', !isValid && this.value);
      });
    });
  };

  enhanceForm();

  // Add CSS for additional effects
  const additionalStyles = document.createElement('style');
  additionalStyles.textContent = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .focused .form-label {
      color: var(--accent) !important;
      transform: translateY(-5px);
    }
    
    .form-control.is-valid {
      border-color: var(--green);
      box-shadow: 0 0 0 3px rgba(0, 206, 201, 0.1);
    }
    
    .form-control.is-invalid {
      border-color: var(--orange);
      box-shadow: 0 0 0 3px rgba(253, 121, 168, 0.1);
    }
    
    /* Loading states */
    .loading {
      position: relative;
      overflow: hidden;
    }
    
    .loading::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: loading-shimmer 2s infinite;
    }
    
    @keyframes loading-shimmer {
      to {
        left: 100%;
      }
    }
    
    /* Enhanced hover states */
    .nav-link:hover {
      text-shadow: 0 0 10px currentColor;
    }
    
    .portfolio-card:hover {
      animation: glow 2s infinite;
    }
    
    /* Accessibility improvements */
    .btn:focus {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    
    .form-control:focus {
      outline: none;
    }
    
    /* Print styles */
    @media print {
      .floating-element,
      .loading-overlay,
      .interactive-bg {
        display: none !important;
      }
    }
  `;
  
  document.head.appendChild(additionalStyles);

  // Lazy loading for images (if any get added later)
  const lazyImages = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));

  // Console welcome message
  console.log('%c🚀 DataArcus Website', 
    'color: #00d4ff; font-size: 20px; font-weight: bold;');
  console.log('%cBuilt with premium features and modern web technologies', 
    'color: #40f3ff; font-size: 14px;');
  console.log('%c• Interactive animations\n• Glassmorphism effects\n• Particle system\n• Advanced hover effects\n• Performance optimized', 
    'color: #fff; font-size: 12px; line-height: 1.5;');

  // Error handling for critical functions
  window.addEventListener('error', (e) => {
    console.warn('DataArcus: Non-critical error handled:', e.message);
  });

  // Final initialization complete
  document.body.classList.add('loaded');
  console.log('✅ DataArcus Website fully initialized!');

  // --- Initialize Custom Dropdown ---
  const budgetSelect = document.getElementById('budget-select');
  if (budgetSelect) {
    budgetSelect.classList.add('form-select');
    // The dropdown already works perfectly with your existing CSS
  }

  // --- Anchor Link Correction on Page Load ---
  // This fixes the issue where jumping to a section from another page
  // doesn't account for the fixed navbar height due to a race condition.
  window.addEventListener('load', () => {
    if (window.location.hash) {
      const targetId = window.location.hash;
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        // A small delay ensures all elements are rendered and have their final dimensions
        setTimeout(() => {
          const navbar = document.querySelector('#navbar');
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'auto' // Use 'auto' for an instant jump, 'smooth' for a scroll
          });
        }, 300); // 100ms delay to let the page settle
      }
    }
  });

});
