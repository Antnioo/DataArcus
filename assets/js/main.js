/*
===================================================================
* Premium DataArcus JavaScript
*
* TABLE OF CONTENTS
* ===================================================================
*
* 1. Initialization & Core Setup
* - Loading Overlay
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
* - Mouse Move Parallax Effect
* - Dynamic Gradient for CTA
*
* 4. Component-Specific Interactions
* - Glass, Service & Portfolio Card Hovers
* - Enhanced Button Interactions (Accent & Ripple)
* - Tech Icon Interactions
*
* 5. Forms
* - Main Contact Form Handler
* - Demo Request Form Handler
* - Enhanced Form Validation UX
*
* 6. Utility, Performance & Finalization
* - Keyboard Navigation Enhancement
* - Lazy Loading for Images
* - Performance Monitoring
* - Console Welcome Message
* - Final Initialization
*
* ===================================================================
*/

document.addEventListener('DOMContentLoaded', () => {

  /**
   * 1. Initialization & Core Setup
   * Handles the initial setup of the page, including the loading screen,
   * background particles, AOS library, and dynamic footer year.
   */
  
  // Hide loading overlay after a delay
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    setTimeout(() => {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => loadingOverlay.style.display = 'none', 500);
    }, 1000);
  }

  // Generate interactive background particles
  const interactiveBg = document.getElementById('interactiveBg');
  if (interactiveBg) {
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
  if (window.innerWidth > 767) {
    AOS.init({
      once: true,
      duration: 800,
      easing: 'ease-out-cubic'
    });
  }

  // Update year in footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }


  /**
   * 2. Navigation & Scrolling
   * Manages all navigation and scrolling behaviors, including the navbar's
   * appearance on scroll and smooth scrolling for anchor links.
   */

  // Add a 'scrolled' class to the navbar when the page is scrolled
  const nav = document.querySelector('.navbar');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    onScroll(); // Check on initial load
    window.addEventListener('scroll', onScroll);
  }

  // Handle smooth scrolling for on-page anchor links, accounting for the fixed navbar
  document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a');
    if (!anchor || !anchor.getAttribute('href')?.startsWith('#') || anchor.getAttribute('href') === '#') {
      return;
    }
    
    const targetId = anchor.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      e.preventDefault();
      const navbarHeight = nav ? nav.offsetHeight : 0;
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Close mobile navbar after click
      const navmenu = document.querySelector('#navmenu');
      if (navmenu && navmenu.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(navmenu, { toggle: false });
        bsCollapse.hide();
      }
    }
  });

  // Corrects scroll position for anchor links on cross-page navigation
  window.addEventListener('load', () => {
    if (window.location.hash) {
      const targetId = window.location.hash;
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        setTimeout(() => {
          const navbarHeight = nav ? nav.offsetHeight : 0;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'auto'
          });
        }, 300);
      }
    }
  });


  /**
   * 3. Dynamic Animations & Effects
   * Controls animations that respond to user interaction or visibility,
   * such as counters, parallax effects, and element fading.
   */

  // Animate numbers in the stats section when they become visible
  const statsSection = document.querySelector('#about');
  if (statsSection) {
    const animateCounters = () => {
      const counters = statsSection.querySelectorAll('[data-count]');
      counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-count'));
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += step;
          if (current >= target) {
            counter.textContent = target + suffix;
          } else {
            counter.textContent = target.toString().includes('.') 
              ? current.toFixed(1) 
              : Math.floor(current);
            requestAnimationFrame(updateCounter);
          }
        };
        updateCounter();
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

  fadeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(el);
  });

  // Apply parallax effect to floating elements on mouse move
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
  
  // Add hover effects for non-portfolio glass cards
  document.querySelectorAll('.glass-card:not(.portfolio-card)').forEach(card => {
    card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-5px) scale(1.02)');
    card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0) scale(1)');
  });

  // Add 3D tilt effect for service cards
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

  // Add hover effect for accent buttons
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

  // Add hover effects for tech stack icons
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


  /**
   * 5. Forms
   * Handles submission and validation for all forms on the site.
   */

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

      resultContainer.innerHTML = `<div class="alert alert-info mt-3">Please wait...</div>`;
      resultContainer.style.display = 'block';
      formButton.innerHTML = `<i class="bi bi-hourglass-split me-2"></i>Sending...`;
      formButton.disabled = true;

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: json
      })
      .then(async (response) => {
        const jsonResponse = await response.json();
        const alertClass = response.status === 200 ? 'alert-success' : 'alert-danger';
        resultContainer.innerHTML = `<div class="alert ${alertClass} mt-3">${jsonResponse.message}</div>`;
      })
      .catch(error => {
        console.error(error);
        resultContainer.innerHTML = `<div class="alert alert-danger mt-3">Something went wrong!</div>`;
      })
      .finally(() => {
        formButton.innerHTML = originalButtonHtml;
        formButton.disabled = false;
        form.reset();
        setTimeout(() => resultContainer.style.display = 'none', 6000);
      });
    });
  };

  // Initialize form handlers
  handleFormSubmit(document.getElementById('contact-form'), document.getElementById('form-result'));
  handleFormSubmit(document.getElementById('demo-form'), document.getElementById('demo-form-result'));
  
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
   * 6. Utility, Performance & Finalization
   * Contains helper scripts, performance monitoring, and final setup calls.
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

  // Initialize lazy loading for images with data-src attribute
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (lazyImages.length > 0) {
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
  }

  // Log page load performance to the console
  window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      console.log(`🚀 DataArcus loaded in ${loadTime}ms`);
    }
  });

  // Display a welcome message in the browser console
  console.log('%c🚀 DataArcus Website', 'color: #00d4ff; font-size: 20px; font-weight: bold;');
  console.log('%cBuilt with premium features and modern web technologies.', 'color: #40f3ff; font-size: 14px;');

  // Final initialization complete signal
  document.body.classList.add('loaded');
  console.log('✅ DataArcus Website fully initialized!');

});