/**
 * AuraCeiling — Strict Backend & Universal Validation Engine
 * 
 * Provides strict validation and sanitized database persistence.
 * Can be run in Node.js (Express, serverless, CLI) or in the browser.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AuraBackend = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Strict Regular Expressions
  // Name: Letters and spaces only, min 2 chars, max 60 chars. No digits, no symbols.
  const NAME_REGEX = /^[A-Za-z]+([ A-Za-z]+)*$/;
  // Mobile: Exactly 10 digits, numbers only.
  const MOBILE_REGEX = /^\d{10}$/;
  // Email: Mandatory @ and valid domain with extension >= 2 chars.
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const ALLOWED_SERVICES = [
    'False Ceiling',
    'Partition Walls',
    'Soundproofing',
    'Gypsum Cornices',
    'Painting & Finishing'
  ];

  /**
   * Sanitize string against XSS / HTML injection
   */
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  }

  /**
   * Field-level Validators
   */
  const Validators = {
    name: function (val, fieldLabel) {
      fieldLabel = fieldLabel || 'Name';
      if (!val || typeof val !== 'string' || !val.trim()) {
        return { valid: false, error: `${fieldLabel} is required.` };
      }
      const trimmed = val.trim();
      if (trimmed.length < 2) {
        return { valid: false, error: `${fieldLabel} must be at least 2 characters.` };
      }
      if (trimmed.length > 60) {
        return { valid: false, error: `${fieldLabel} cannot exceed 60 characters.` };
      }
      // Check for numbers specifically
      if (/\d/.test(trimmed)) {
        return { valid: false, error: `${fieldLabel} must not contain numbers.` };
      }
      // Check for special characters
      if (/[^a-zA-Z\s]/.test(trimmed)) {
        return { valid: false, error: `${fieldLabel} can only contain letters and spaces.` };
      }
      // Check full pattern
      if (!NAME_REGEX.test(trimmed)) {
        return { valid: false, error: `${fieldLabel} can only contain letters and spaces.` };
      }
      return { valid: true, value: trimmed };
    },

    mobile: function (val, fieldLabel) {
      fieldLabel = fieldLabel || 'Mobile number';
      if (!val || typeof val !== 'string' || !val.trim()) {
        return { valid: false, error: `${fieldLabel} is required.` };
      }
      const trimmed = val.trim();
      // Check for alphabets
      if (/[a-zA-Z]/.test(trimmed)) {
        return { valid: false, error: `${fieldLabel} must contain numbers only (no letters).` };
      }
      // Check for symbols
      if (/\D/.test(trimmed)) {
        return { valid: false, error: `${fieldLabel} must contain numbers only.` };
      }
      // Check exact length
      if (trimmed.length !== 10) {
        return { valid: false, error: `${fieldLabel} must contain exactly 10 digits.` };
      }
      if (!MOBILE_REGEX.test(trimmed)) {
        return { valid: false, error: `${fieldLabel} must contain exactly 10 digits.` };
      }
      return { valid: true, value: trimmed };
    },

    email: function (val, fieldLabel) {
      fieldLabel = fieldLabel || 'Email';
      if (!val || typeof val !== 'string' || !val.trim()) {
        return { valid: false, error: `${fieldLabel} is required.` };
      }
      const trimmed = val.trim();
      if (!trimmed.includes('@')) {
        return { valid: false, error: "Email must include an '@' symbol." };
      }
      const parts = trimmed.split('@');
      if (parts.length !== 2) {
        return { valid: false, error: "Email must contain only one '@' symbol." };
      }
      const local = parts[0];
      const domain = parts[1];
      if (!local) {
        return { valid: false, error: "Email is missing the username before '@'." };
      }
      if (!domain) {
        return { valid: false, error: "Email is missing the domain after '@'." };
      }
      if (!domain.includes('.')) {
        return { valid: false, error: "Email must include a valid domain extension (e.g. .com)." };
      }
      const domainParts = domain.split('.');
      const tld = domainParts[domainParts.length - 1];
      if (!tld || tld.length < 2) {
        return { valid: false, error: "Email has an invalid domain extension." };
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        return { valid: false, error: 'Please enter a valid email address (e.g., user@example.com).' };
      }
      return { valid: true, value: trimmed.toLowerCase() };
    },

    service: function (val) {
      if (!val || typeof val !== 'string' || !val.trim()) {
        return { valid: false, error: 'Please select a service.' };
      }
      const trimmed = val.trim();
      if (!ALLOWED_SERVICES.includes(trimmed)) {
        return { valid: false, error: 'Please select a valid service from the list.' };
      }
      return { valid: true, value: trimmed };
    },

    message: function (val, fieldLabel) {
      fieldLabel = fieldLabel || 'Message';
      if (!val || typeof val !== 'string' || !val.trim()) {
        return { valid: false, error: `${fieldLabel} is required.` };
      }
      const trimmed = val.trim();
      if (trimmed.length < 10) {
        return { valid: false, error: `${fieldLabel} must be at least 10 characters.` };
      }
      if (trimmed.length > 2000) {
        return { valid: false, error: `${fieldLabel} cannot exceed 2000 characters.` };
      }
      return { valid: true, value: trimmed };
    },

    comment: function (val) {
      if (!val || typeof val !== 'string' || !val.trim()) {
        return { valid: false, error: 'Comment is required.' };
      }
      const trimmed = val.trim();
      if (trimmed.length < 5) {
        return { valid: false, error: 'Comment must be at least 5 characters.' };
      }
      if (trimmed.length > 1000) {
        return { valid: false, error: 'Comment cannot exceed 1000 characters.' };
      }
      return { valid: true, value: trimmed };
    },

    number: function (val, fieldLabel) {
      fieldLabel = fieldLabel || 'Number';
      if (val === undefined || val === null || val === '') {
        return { valid: false, error: `${fieldLabel} is required.` };
      }
      const numStr = String(val).trim();
      if (!/^\d+$/.test(numStr)) {
        return { valid: false, error: `${fieldLabel} must contain numbers only.` };
      }
      const n = parseInt(numStr, 10);
      if (isNaN(n) || n <= 0) {
        return { valid: false, error: `${fieldLabel} must be greater than 0.` };
      }
      return { valid: true, value: n };
    }
  };

  /**
   * Schema Form Validators
   */
  function validateInquiry(payload) {
    payload = payload || {};
    const errors = {};
    const sanitized = {};

    const nameRes = Validators.name(payload.name, 'Full name');
    if (!nameRes.valid) errors.name = nameRes.error;
    else sanitized.name = sanitize(nameRes.value);

    const emailRes = Validators.email(payload.email, 'Email');
    if (!emailRes.valid) errors.email = emailRes.error;
    else sanitized.email = sanitize(emailRes.value);

    const phoneRes = Validators.mobile(payload.phone, 'Mobile number');
    if (!phoneRes.valid) errors.phone = phoneRes.error;
    else sanitized.phone = sanitize(phoneRes.value);

    const serviceRes = Validators.service(payload.service);
    if (!serviceRes.valid) errors.service = serviceRes.error;
    else sanitized.service = sanitize(serviceRes.value);

    const messageRes = Validators.message(payload.message, 'Message');
    if (!messageRes.valid) errors.message = messageRes.error;
    else sanitized.message = sanitize(messageRes.value);

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid: isValid,
      errors: errors,
      sanitized: isValid ? sanitized : null
    };
  }

  function validateNewsletter(payload) {
    payload = payload || {};
    const errors = {};
    const sanitized = {};

    const emailRes = Validators.email(payload.email, 'Email address');
    if (!emailRes.valid) errors.email = emailRes.error;
    else sanitized.email = sanitize(emailRes.value);

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid: isValid,
      errors: errors,
      sanitized: isValid ? sanitized : null
    };
  }

  function validateComment(payload) {
    payload = payload || {};
    const errors = {};
    const sanitized = {};

    const nameRes = Validators.name(payload.name, 'Name');
    if (!nameRes.valid) errors.name = nameRes.error;
    else sanitized.name = sanitize(nameRes.value);

    const commentRes = Validators.comment(payload.comment);
    if (!commentRes.valid) errors.comment = commentRes.error;
    else sanitized.comment = sanitize(commentRes.value);

    const isValid = Object.keys(errors).length === 0;
    return {
      isValid: isValid,
      errors: errors,
      sanitized: isValid ? sanitized : null
    };
  }

  /**
   * Database / Persistence Layer (localStorage in browser or MemoryStore in Node)
   */
  const MemoryStore = {
    inquiries: [],
    subscribers: [],
    comments: []
  };

  const Database = {
    getStorage: function (key) {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = window.localStorage.getItem(key);
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      }
      return MemoryStore[key] || [];
    },

    setStorage: function (key, items) {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(key, JSON.stringify(items));
        } catch (e) {
          console.warn('LocalStorage write failed', e);
        }
      } else {
        MemoryStore[key] = items;
      }
    },

    saveInquiry: function (payload) {
      const result = validateInquiry(payload);
      if (!result.isValid) {
        return {
          success: false,
          status: 400,
          statusText: 'Bad Request: Validation Failed',
          errors: result.errors
        };
      }
      const record = {
        id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        ...result.sanitized,
        createdAt: new Date().toISOString()
      };
      const items = Database.getStorage('aura_db_inquiries');
      items.push(record);
      Database.setStorage('aura_db_inquiries', items);
      return {
        success: true,
        status: 200,
        statusText: 'OK',
        message: 'Inquiry successfully validated and saved to database.',
        data: record
      };
    },

    saveSubscriber: function (payload) {
      const result = validateNewsletter(payload);
      if (!result.isValid) {
        return {
          success: false,
          status: 400,
          statusText: 'Bad Request: Validation Failed',
          errors: result.errors
        };
      }
      const subscribers = Database.getStorage('aura_db_subscribers');
      // Prevent duplicate subscriber emails
      const exists = subscribers.some(s => s.email.toLowerCase() === result.sanitized.email.toLowerCase());
      if (!exists) {
        const record = {
          id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          ...result.sanitized,
          subscribedAt: new Date().toISOString()
        };
        subscribers.push(record);
        Database.setStorage('aura_db_subscribers', subscribers);
      }
      return {
        success: true,
        status: 200,
        statusText: 'OK',
        message: 'Subscription successfully validated and saved.',
        data: { email: result.sanitized.email }
      };
    },

    saveComment: function (payload) {
      const result = validateComment(payload);
      if (!result.isValid) {
        return {
          success: false,
          status: 400,
          statusText: 'Bad Request: Validation Failed',
          errors: result.errors
        };
      }
      const record = {
        id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        ...result.sanitized,
        createdAt: new Date().toISOString()
      };
      const comments = Database.getStorage('aura_db_comments');
      comments.push(record);
      Database.setStorage('aura_db_comments', comments);
      return {
        success: true,
        status: 200,
        statusText: 'OK',
        message: 'Comment successfully validated and saved.',
        data: record
      };
    },

    getInquiries: function () {
      return Database.getStorage('aura_db_inquiries');
    },

    getSubscribers: function () {
      return Database.getStorage('aura_db_subscribers');
    },

    getComments: function () {
      return Database.getStorage('aura_db_comments');
    }
  };

  return {
    Validators: Validators,
    validateInquiry: validateInquiry,
    validateNewsletter: validateNewsletter,
    validateComment: validateComment,
    sanitize: sanitize,
    saveInquiry: Database.saveInquiry,
    saveSubscriber: Database.saveSubscriber,
    saveComment: Database.saveComment,
    getInquiries: Database.getInquiries,
    getSubscribers: Database.getSubscribers,
    getComments: Database.getComments
  };
});
