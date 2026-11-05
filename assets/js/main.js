/* ==========================================================================
   AuraCeiling — Main JavaScript
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Theme (Dark / Light) ---------- */
  const THEME_KEY = 'auraceiling-theme';
  const RTL_KEY = 'auraceiling-rtl';

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function setStoredTheme(v) {
    try { localStorage.setItem(THEME_KEY, v); } catch (e) {}
  }
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    updateThemeIcons(theme);
  }
  function currentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setStoredTheme(next);
  }
  function updateThemeIcons(theme) {
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.setAttribute('data-state', theme);
    });
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      const sun = btn.querySelector('.icon-sun');
      const moon = btn.querySelector('.icon-moon');
      if (sun && moon) {
        if (theme === 'dark') { sun.classList.remove('hidden'); moon.classList.add('hidden'); }
        else { sun.classList.add('hidden'); moon.classList.remove('hidden'); }
      }
    });
  }

  /* ---------- RTL ---------- */
  function applyRTL(isRtl) {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.querySelectorAll('.rtl-toggle').forEach((el) => {
      el.setAttribute('aria-label', isRtl ? 'Switch to Left-to-Right (LTR)' : 'Switch to Right-to-Left (RTL)');
      el.setAttribute('title', isRtl ? 'Switch to LTR' : 'Switch to RTL');
      if (isRtl) {
        el.classList.add('text-gold', 'bg-slate-100', 'dark:bg-slate-800');
      } else {
        el.classList.remove('text-gold', 'bg-slate-100', 'dark:bg-slate-800');
      }
    });
  }
  function toggleRTL() {
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
    const next = !isRtl;
    applyRTL(next);
    try { localStorage.setItem(RTL_KEY, next ? 'rtl' : 'ltr'); } catch (e) {}
  }

  /* ---------- Dropdowns ---------- */
  function initDropdowns() {
    document.querySelectorAll('[data-dropdown]').forEach((dd) => {
      const toggle = dd.querySelector('[data-dropdown-toggle]');
      const menu = dd.querySelector('[data-dropdown-menu]');
      const arrow = dd.querySelector('[data-dropdown-arrow]') || dd.querySelector('[data-lucide="chevron-down"]');
      if (!toggle || !menu) return;

      let timer = null;

      const openDropdown = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        // Close other dropdowns
        document.querySelectorAll('[data-dropdown]').forEach((otherDd) => {
          if (otherDd !== dd) {
            const m = otherDd.querySelector('[data-dropdown-menu]');
            const a = otherDd.querySelector('[data-dropdown-arrow]') || otherDd.querySelector('[data-lucide="chevron-down"]');
            const t = otherDd.querySelector('[data-dropdown-toggle]');
            if (m) m.classList.add('hidden');
            if (a) a.classList.remove('rotate-180');
            if (t) t.setAttribute('aria-expanded', 'false');
            otherDd.classList.remove('open');
          }
        });
        menu.classList.remove('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        dd.classList.add('open');
        if (arrow) arrow.classList.add('rotate-180');
      };

      const closeDropdown = (immediate = false) => {
        const doClose = () => {
          menu.classList.add('hidden');
          toggle.setAttribute('aria-expanded', 'false');
          dd.classList.remove('open');
          if (arrow) arrow.classList.remove('rotate-180');
        };
        if (immediate) {
          if (timer) clearTimeout(timer);
          doClose();
        } else {
          if (timer) clearTimeout(timer);
          timer = setTimeout(doClose, 180);
        }
      };

      // Click toggle: works smoothly on touch, keyboard, and click
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = !menu.classList.contains('hidden');
        if (isOpen) {
          closeDropdown(true);
        } else {
          openDropdown();
        }
      });

      // Desktop hover with 180ms safe-exit grace period
      dd.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) {
          openDropdown();
        }
      });

      dd.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) {
          closeDropdown(false);
        }
      });

      // Close when an inner link is clicked
      menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          closeDropdown(true);
        });
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-dropdown]')) {
        document.querySelectorAll('[data-dropdown]').forEach((dd) => {
          const menu = dd.querySelector('[data-dropdown-menu]');
          const toggle = dd.querySelector('[data-dropdown-toggle]');
          const arrow = dd.querySelector('[data-dropdown-arrow]') || dd.querySelector('[data-lucide="chevron-down"]');
          if (menu) menu.classList.add('hidden');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
          if (arrow) arrow.classList.remove('rotate-180');
          dd.classList.remove('open');
        });
      }
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('[data-dropdown]').forEach((dd) => {
          const menu = dd.querySelector('[data-dropdown-menu]');
          const toggle = dd.querySelector('[data-dropdown-toggle]');
          const arrow = dd.querySelector('[data-dropdown-arrow]') || dd.querySelector('[data-lucide="chevron-down"]');
          if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'false');
              toggle.focus();
            }
            if (arrow) arrow.classList.remove('rotate-180');
            dd.classList.remove('open');
          }
        });
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    const menu = document.querySelector('[data-mobile-menu]');
    const overlay = document.querySelector('[data-mobile-overlay]');
    if (!menu) return;
    let overlayTimeout = null;

    const open = () => {
      if (overlayTimeout) clearTimeout(overlayTimeout);
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      if (overlay) {
        overlay.classList.remove('hidden');
        void overlay.offsetWidth;
        overlay.classList.add('open');
      }
      document.body.style.overflow = 'hidden';
      document.querySelectorAll('[data-mobile-toggle]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'true');
      });
    };

    const close = () => {
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      if (overlay) {
        overlay.classList.remove('open');
        overlayTimeout = setTimeout(() => {
          if (!menu.classList.contains('open')) {
            overlay.classList.add('hidden');
          }
        }, 300);
      }
      document.body.style.overflow = '';
      document.querySelectorAll('[data-mobile-toggle]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
      });
    };

    document.querySelectorAll('[data-mobile-toggle]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        menu.classList.contains('open') ? close() : open();
      });
    });

    if (overlay) overlay.addEventListener('click', close);
    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        close();
      });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && menu.classList.contains('open')) {
        close();
      }
    });
  }

  /* ---------- Sticky header shadow & scroll detection ---------- */
  function initHeaderScroll() {
    const header = document.querySelector('[data-header]');
    if (!header) return;
    const onScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
      if (scrollY > 10) {
        header.classList.add('scrolled', 'shadow-2xl');
      } else {
        header.classList.remove('scrolled', 'shadow-2xl');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Accordion (FAQ) ---------- */
  function initAccordion() {
    document.querySelectorAll('[data-accordion]').forEach((group) => {
      group.querySelectorAll('[data-accordion-trigger]').forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const item = trigger.closest('[data-accordion-item]');
          const isActive = item.classList.contains('active');
          // close siblings if single-open
          if (group.hasAttribute('data-single')) {
            group.querySelectorAll('[data-accordion-item].active').forEach((i) => i.classList.remove('active'));
          }
          if (!isActive) item.classList.add('active');
        });
      });
    });
  }

  /* ---------- Filter chips ---------- */
  function initFilters() {
    document.querySelectorAll('[data-filter-group]').forEach((group) => {
      const chips = group.querySelectorAll('[data-filter]');
      const targetSelector = group.getAttribute('data-filter-target');
      const items = targetSelector ? document.querySelectorAll(targetSelector) : [];
      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          chips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          const value = chip.getAttribute('data-filter');
          items.forEach((item) => {
            const cats = (item.getAttribute('data-category') || '').split(/\s+/);
            const show = value === 'all' || cats.includes(value);
            item.style.display = show ? '' : 'none';
            if (show) item.classList.add('animate-fade-up');
          });
        });
      });
    });
  }

  /* ---------- Search (blog) ---------- */
  function initSearch() {
    const input = document.querySelector('[data-search-input]');
    const items = document.querySelectorAll('[data-search-item]');
    if (!input || !items.length) return;
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      items.forEach((item) => {
        const text = (item.textContent || '').toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    const lb = document.querySelector('[data-lightbox]');
    if (!lb) return;
    const img = lb.querySelector('img');
    const closeBtn = lb.querySelector('[data-lightbox-close]');
    const open = (src, alt) => {
      img.src = src;
      img.alt = alt || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    };
    document.querySelectorAll('[data-lightbox-src]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open(el.getAttribute('data-lightbox-src'), el.getAttribute('data-lightbox-alt'));
      });
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
  }

  /* ---------- Testimonial slider ---------- */
  function initTestimonials() {
    const track = document.querySelector('[data-testi-track]');
    if (!track) return;
    const slides = track.children;
    const total = slides.length;
    let idx = 0;
    const go = (i) => {
      idx = (i + total) % total;
      track.style.transform = `translateX(-${idx * 100}%)`;
      document.querySelectorAll('[data-testi-dot]').forEach((d, di) => {
        d.classList.toggle('bg-gold', di === idx);
        d.classList.toggle('bg-slate-300', di !== idx);
        d.classList.toggle('dark:bg-slate-600', di !== idx);
      });
    };
    document.querySelectorAll('[data-testi-prev]').forEach((b) => b.addEventListener('click', () => go(idx - 1)));
    document.querySelectorAll('[data-testi-next]').forEach((b) => b.addEventListener('click', () => go(idx + 1)));
    document.querySelectorAll('[data-testi-dot]').forEach((d, di) => d.addEventListener('click', () => go(di)));
    // autoplay
    let timer = setInterval(() => go(idx + 1), 5000);
    track.parentElement.addEventListener('mouseenter', () => clearInterval(timer));
    track.parentElement.addEventListener('mouseleave', () => { timer = setInterval(() => go(idx + 1), 5000); });
    go(0);
  }

  /* ---------- Validation Regular Expressions ---------- */
  const NAME_REGEX = /^[A-Za-z]+([ A-Za-z]+)*$/;
  const MOBILE_REGEX = /^\d{10}$/;
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /* ---------- Error Display Helpers ---------- */
  function getOrCreateErrorElement(field) {
    const wrap = field.closest('.field') || field.closest('form') || field.parentElement;
    let err = null;
    if (field.name) {
      err = wrap.querySelector(`[data-error-for="${field.name}"]`) ||
            wrap.querySelector(`[data-field-error="${field.name}"]`);
    }
    if (!err) {
      err = wrap.querySelector('.field-error');
    }
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error text-xs text-red-500 mt-1 font-medium';
      if (field.name) err.setAttribute('data-error-for', field.name);
      const flexWrap = field.closest('.flex');
      if (flexWrap && flexWrap.parentElement) {
        flexWrap.parentElement.insertBefore(err, flexWrap.nextSibling);
      } else {
        field.insertAdjacentElement('afterend', err);
      }
    }
    return err;
  }

  function showFieldError(field, msg) {
    field.classList.add('input-error');
    field.setAttribute('aria-invalid', 'true');
    const err = getOrCreateErrorElement(field);
    if (err) {
      err.textContent = msg;
      err.classList.remove('hidden');
    }
  }

  function clearFieldError(field) {
    field.classList.remove('input-error');
    field.setAttribute('aria-invalid', 'false');
    const wrap = field.closest('.field') || field.closest('form') || field.parentElement;
    let err = null;
    if (field.name) {
      err = wrap.querySelector(`[data-error-for="${field.name}"]`) ||
            wrap.querySelector(`[data-field-error="${field.name}"]`);
    }
    if (!err) {
      err = wrap.querySelector('.field-error');
    }
    if (err) {
      err.classList.add('hidden');
      err.textContent = '';
    }
  }

  /* ---------- Strict Field Validator ---------- */
  function validateFormField(field) {
    const val = (field.value || '').trim();
    const isRequired = field.hasAttribute('required') || field.required;
    const type = field.getAttribute('data-type') || field.type || '';
    const name = (field.name || '').toLowerCase();
    const id = (field.id || '').toLowerCase();
    const isNameField = type === 'name' || name.includes('name') || id.includes('name');
    const isPhoneField = type === 'phone' || type === 'tel' || name.includes('phone') || name.includes('mobile') || id.includes('phone');
    const isEmailField = type === 'email' || name.includes('email') || id.includes('email');
    const isNumberField = type === 'number' || field.type === 'number';

    // Required check
    if (isRequired && !val) {
      if (isNameField) return { valid: false, error: 'Full name is required.' };
      if (isPhoneField) return { valid: false, error: 'Mobile number is required.' };
      if (isEmailField) return { valid: false, error: 'Email address is required.' };
      if (field.tagName === 'SELECT') return { valid: false, error: 'Please select a service.' };
      if (field.tagName === 'TEXTAREA') return { valid: false, error: 'Message is required.' };
      return { valid: false, error: 'This field is required.' };
    }

    if (!val && !isRequired) {
      return { valid: true };
    }

    // 1. Name Field validation (letters only, uppercase/lowercase, spaces between names, NO numbers, NO special chars)
    if (isNameField) {
      if (/\d/.test(val)) {
        return { valid: false, error: 'Name cannot contain numbers.' };
      }
      if (/[^a-zA-Z\s]/.test(val)) {
        return { valid: false, error: 'Name can only contain letters and spaces.' };
      }
      if (val.length < 2) {
        return { valid: false, error: 'Name must be at least 2 characters.' };
      }
      if (!NAME_REGEX.test(val)) {
        return { valid: false, error: 'Name can only contain letters and spaces.' };
      }
      return { valid: true };
    }

    // 2. Number / Mobile Field validation (numbers only, exactly 10 digits for mobile)
    if (isPhoneField) {
      if (/[a-zA-Z]/.test(val)) {
        return { valid: false, error: 'Mobile number must contain numbers only (no letters).' };
      }
      if (/\D/.test(val)) {
        return { valid: false, error: 'Mobile number must contain numbers only.' };
      }
      if (val.length !== 10) {
        return { valid: false, error: 'Mobile number must be exactly 10 digits.' };
      }
      if (!MOBILE_REGEX.test(val)) {
        return { valid: false, error: 'Mobile number must be exactly 10 digits.' };
      }
      return { valid: true };
    }

    // 3. Email Field validation (mandatory @, valid domain after @)
    if (isEmailField) {
      if (!val.includes('@')) {
        return { valid: false, error: "Email must include an '@' symbol." };
      }
      const parts = val.split('@');
      if (parts.length !== 2) {
        return { valid: false, error: "Email must contain only one '@' symbol." };
      }
      const local = parts[0];
      const domain = parts[1];
      if (!local) {
        return { valid: false, error: "Email is missing username before '@'." };
      }
      if (!domain) {
        return { valid: false, error: "Email is missing domain after '@'." };
      }
      if (!domain.includes('.')) {
        return { valid: false, error: 'Email must include a valid domain extension (e.g. .com).' };
      }
      const domainParts = domain.split('.');
      const tld = domainParts[domainParts.length - 1];
      if (!tld || tld.length < 2) {
        return { valid: false, error: 'Email has an invalid domain extension.' };
      }
      if (!EMAIL_REGEX.test(val)) {
        return { valid: false, error: 'Please enter a valid email address (e.g., user@example.com).' };
      }
      return { valid: true };
    }

    // 4. Number inputs (area, etc.)
    if (isNumberField) {
      if (/\D/.test(val)) {
        return { valid: false, error: 'Must contain numbers only.' };
      }
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        return { valid: false, error: 'Please enter a valid positive number.' };
      }
      return { valid: true };
    }

    // 5. Select input
    if (field.tagName === 'SELECT') {
      if (!val) {
        return { valid: false, error: 'Please select a valid option.' };
      }
      return { valid: true };
    }

    // 6. Textarea
    if (field.tagName === 'TEXTAREA') {
      const minLen = field.minLength && field.minLength > 0 ? field.minLength : 10;
      if (val.length < minLen) {
        return { valid: false, error: `Message must be at least ${minLen} characters.` };
      }
      return { valid: true };
    }

    return { valid: true };
  }

  /* ---------- Real-time Input Filtering (UX Protection) ---------- */
  function attachInputRestrictions(field) {
    if (!field || field._hasRestrictions) return;
    field._hasRestrictions = true;

    const type = field.getAttribute('data-type') || field.type || '';
    const name = (field.name || '').toLowerCase();
    const id = (field.id || '').toLowerCase();
    const isNameField = type === 'name' || name.includes('name') || id.includes('name');
    const isPhoneField = type === 'phone' || type === 'tel' || name.includes('phone') || name.includes('mobile') || id.includes('phone');
    const isNumberField = type === 'number' || field.type === 'number';

    if (isNameField) {
      field.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key)) return;
        if (!/^[a-zA-Z\s]$/.test(e.key)) {
          e.preventDefault();
        }
      });
      field.addEventListener('input', () => {
        const sanitized = field.value.replace(/[^a-zA-Z\s]/g, '');
        if (field.value !== sanitized) {
          field.value = sanitized;
        }
        const check = validateFormField(field);
        if (check.valid) {
          clearFieldError(field);
        }
      });
      field.addEventListener('blur', () => {
        const check = validateFormField(field);
        if (!check.valid && (field.hasAttribute('required') || field.value.length > 0)) {
          showFieldError(field, check.error);
        }
      });
    }

    if (isPhoneField) {
      field.setAttribute('maxlength', '10');
      field.setAttribute('inputmode', 'numeric');
      field.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key)) return;
        if (!/^\d$/.test(e.key)) {
          e.preventDefault();
          return;
        }
        if (field.value.length >= 10 && field.selectionStart === field.selectionEnd) {
          e.preventDefault();
        }
      });
      field.addEventListener('input', () => {
        const sanitized = field.value.replace(/\D/g, '').slice(0, 10);
        if (field.value !== sanitized) {
          field.value = sanitized;
        }
        const check = validateFormField(field);
        if (check.valid) {
          clearFieldError(field);
        }
      });
      field.addEventListener('blur', () => {
        const check = validateFormField(field);
        if (!check.valid && (field.hasAttribute('required') || field.value.length > 0)) {
          showFieldError(field, check.error);
        }
      });
    }

    if (isNumberField) {
      field.setAttribute('inputmode', 'numeric');
      field.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key)) return;
        if (['e', 'E', '+', '-', '.'].includes(e.key) || !/^\d$/.test(e.key)) {
          e.preventDefault();
        }
      });
      field.addEventListener('input', () => {
        const sanitized = field.value.replace(/\D/g, '');
        if (field.value !== sanitized) {
          field.value = sanitized;
        }
        const check = validateFormField(field);
        if (check.valid) {
          clearFieldError(field);
        }
      });
    }

    if (field.type === 'email' || type === 'email') {
      field.addEventListener('input', () => {
        const check = validateFormField(field);
        if (check.valid) {
          clearFieldError(field);
        }
      });
      field.addEventListener('blur', () => {
        const check = validateFormField(field);
        if (!check.valid && (field.hasAttribute('required') || field.value.length > 0)) {
          showFieldError(field, check.error);
        }
      });
    }

    if (field.tagName === 'SELECT' || field.tagName === 'TEXTAREA') {
      field.addEventListener('input', () => {
        const check = validateFormField(field);
        if (check.valid) clearFieldError(field);
      });
      field.addEventListener('change', () => {
        const check = validateFormField(field);
        if (check.valid) clearFieldError(field);
      });
      field.addEventListener('blur', () => {
        const check = validateFormField(field);
        if (!check.valid && (field.hasAttribute('required') || field.value.length > 0)) {
          showFieldError(field, check.error);
        }
      });
    }
  }

  /* ---------- Cost estimator (Home) ---------- */
  function initEstimator() {
    const form = document.querySelector('[data-estimator]');
    if (!form) return;
    const area = form.querySelector('[name="area"]');
    const type = form.querySelector('[name="type"]');
    const result = form.querySelector('[data-estimator-result]');
    const rates = { pop: 45, tray: 65, wooden: 85, acoustic: 55, cornice: 30, partition: 40 };

    if (area) attachInputRestrictions(area);

    const calc = () => {
      const a = parseFloat(area ? area.value : 0) || 0;
      const t = (type ? type.value : '') || 'pop';
      const rate = rates[t] || 45;
      const total = a * rate;
      if (result) {
        result.textContent = '$' + total.toLocaleString(undefined, { maximumFractionDigits: 0 });
      }
    };
    area && area.addEventListener('input', calc);
    type && type.addEventListener('change', calc);
    calc();
  }

  /* ---------- Pricing calculator (Pricing page) ---------- */
  function initPricingCalc() {
    const form = document.querySelector('[data-pricing-calc]');
    if (!form) return;
    const area = form.querySelector('[name="p-area"]');
    const type = form.querySelector('[name="p-type"]');
    const result = form.querySelector('[data-pricing-result]');
    const rates = { pop: 45, tray: 65, wooden: 85, acoustic: 55, cornice: 30, partition: 40, falseceil: 50 };

    if (area) attachInputRestrictions(area);

    const calc = () => {
      const a = parseFloat(area ? area.value : 0) || 0;
      const rate = rates[type ? type.value : ''] || 45;
      const total = a * rate;
      if (result) result.textContent = '$' + total.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };
    area && area.addEventListener('input', calc);
    type && type.addEventListener('change', calc);
    calc();
  }

  /* ---------- Form Validation & Backend Submission ---------- */
  function validateForm(form) {
    let isValid = true;
    let firstInvalid = null;
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach((field) => {
      if (field.type === 'submit' || field.type === 'button' || field.type === 'hidden') return;
      const check = validateFormField(field);
      if (!check.valid) {
        isValid = false;
        showFieldError(field, check.error);
        if (!firstInvalid) firstInvalid = field;
      } else {
        clearFieldError(field);
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
    }
    return isValid;
  }

  function initForms() {
    document.querySelectorAll('form[data-validate]').forEach((form) => {
      form.querySelectorAll('input, select, textarea').forEach(attachInputRestrictions);

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formErr = form.querySelector('[data-form-error]');
        if (formErr) {
          formErr.classList.add('hidden');
          formErr.textContent = '';
        }

        // 1. Frontend validation
        if (!validateForm(form)) return;

        // 2. Prepare payload for backend API
        const payload = {
          name: form.querySelector('[name="name"]')?.value || '',
          email: form.querySelector('[name="email"]')?.value || '',
          phone: form.querySelector('[name="phone"]')?.value || '',
          service: form.querySelector('[name="service"]')?.value || '',
          message: form.querySelector('[name="message"]')?.value || ''
        };

        // 3. Security / Backend Validation before database saving
        const backend = window.AuraBackend;
        const result = backend && typeof backend.saveInquiry === 'function'
          ? backend.saveInquiry(payload)
          : { success: true, status: 200 };

        if (!result.success || result.status !== 200) {
          // Backend rejected invalid data
          if (result.errors) {
            Object.keys(result.errors).forEach((fieldName) => {
              const field = form.querySelector(`[name="${fieldName}"]`);
              if (field) {
                showFieldError(field, result.errors[fieldName]);
              }
            });
          }
          if (formErr) {
            formErr.textContent = result.statusText || 'Validation error: Invalid data submitted.';
            formErr.classList.remove('hidden');
          }
          return;
        }

        // 4. Reset & Success feedback
        form.reset();
        const success = form.querySelector('[data-form-success]');
        if (success) {
          success.classList.remove('hidden');
          setTimeout(() => success.classList.add('hidden'), 5000);
        }
      });
    });
  }

  /* ---------- Countdown (coming soon) ---------- */
  function initCountdown() {
    const root = document.querySelector('[data-countdown]');
    if (!root) return;
    const target = new Date(root.getAttribute('data-countdown')).getTime();
    const els = {
      d: root.querySelector('[data-cd="days"]'),
      h: root.querySelector('[data-cd="hours"]'),
      m: root.querySelector('[data-cd="minutes"]'),
      s: root.querySelector('[data-cd="seconds"]'),
    };
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        Object.values(els).forEach((e) => { if (e) e.textContent = '00'; });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (els.d) els.d.textContent = String(d).padStart(2, '0');
      if (els.h) els.h.textContent = String(h).padStart(2, '0');
      if (els.m) els.m.textContent = String(m).padStart(2, '0');
      if (els.s) els.s.textContent = String(s).padStart(2, '0');
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Newsletter ---------- */
  function initNewsletter() {
    document.querySelectorAll('[data-newsletter]').forEach((form) => {
      const input = form.querySelector('input[type="email"]');
      if (!input) return;

      attachInputRestrictions(input);

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const check = validateFormField(input);
        if (!check.valid) {
          showFieldError(input, check.error);
          input.focus();
          return;
        }
        clearFieldError(input);

        // Security / Backend validation
        const backend = window.AuraBackend;
        const result = backend && typeof backend.saveSubscriber === 'function'
          ? backend.saveSubscriber({ email: input.value.trim() })
          : { success: true, status: 200 };

        if (!result.success || result.status !== 200) {
          const errMsg = result.errors && result.errors.email ? result.errors.email : 'Invalid subscription request.';
          showFieldError(input, errMsg);
          return;
        }

        input.value = '';
        const msg = form.querySelector('[data-newsletter-success]');
        if (msg) {
          msg.classList.remove('hidden');
          setTimeout(() => msg.classList.add('hidden'), 4000);
        }
      });
    });
  }

  /* ---------- Comments (Blog Detail) ---------- */
  function initCommentForm() {
    document.querySelectorAll('[data-comment-form]').forEach((form) => {
      form.querySelectorAll('input, textarea').forEach(attachInputRestrictions);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateForm(form)) return;

        const nameInput = form.querySelector('[name="comment_name"]');
        const textInput = form.querySelector('[name="comment_text"]');

        const payload = {
          name: nameInput ? nameInput.value.trim() : '',
          comment: textInput ? textInput.value.trim() : ''
        };

        const backend = window.AuraBackend;
        const result = backend && typeof backend.saveComment === 'function'
          ? backend.saveComment(payload)
          : { success: true, status: 200, data: payload };

        if (!result.success || result.status !== 200) {
          if (result.errors) {
            if (result.errors.name && nameInput) showFieldError(nameInput, result.errors.name);
            if (result.errors.comment && textInput) showFieldError(textInput, result.errors.comment);
          }
          return;
        }

        // Dynamically add comment to list
        const list = document.querySelector('#comments-list') || form.previousElementSibling;
        if (list && result.data) {
          const card = document.createElement('div');
          card.className = 'bg-white dark:bg-slate-900 rounded-xl p-4 shadow-soft';
          card.innerHTML = `<div class="font-semibold text-sm">${result.data.name}</div><p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${result.data.comment}</p>`;
          list.appendChild(card);
        }

        form.reset();
        const msg = form.querySelector('[data-comment-success]');
        if (msg) {
          msg.classList.remove('hidden');
          setTimeout(() => msg.classList.add('hidden'), 4000);
        }
      });
    });
  }

  /* ---------- Lucide icons ---------- */
  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /* ---------- Init ---------- */
  function init() {
    // Theme
    const stored = getStoredTheme();
    const hasDarkClass = document.documentElement.classList.contains('dark');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(stored || (hasDarkClass ? 'dark' : (prefersDark ? 'dark' : 'light')));
    // RTL
    const storedRtl = (function(){ try { return localStorage.getItem(RTL_KEY); } catch(e){ return null; } })();
    const hasRtlDir = document.documentElement.getAttribute('dir') === 'rtl';
    applyRTL(storedRtl !== null ? storedRtl === 'rtl' : hasRtlDir);

    // Bind toggles
    document.querySelectorAll('.theme-toggle').forEach((b) => b.addEventListener('click', toggleTheme));
    document.querySelectorAll('.rtl-toggle').forEach((b) => b.addEventListener('click', toggleRTL));

    initDropdowns();
    initMobileMenu();
    initHeaderScroll();
    initAccordion();
    initFilters();
    initSearch();
    initLightbox();
    initTestimonials();
    initEstimator();
    initPricingCalc();
    initForms();
    initCountdown();
    initNewsletter();
    initCommentForm();
    initIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
