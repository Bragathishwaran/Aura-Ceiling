const AuraBackend = require('./assets/js/backend-validator.js');
const fs = require('fs');

console.log('================================================================');
console.log('   STRICT FORM INPUT VALIDATION & SECURITY TEST HARNESS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         Error: ${err.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) throw new Error(`Expected > ${expected} but got ${actual}`);
    },
    toContain(expected) {
      if (!actual || !actual.includes(expected)) throw new Error(`Expected "${actual}" to contain "${expected}"`);
    },
    toBeUndefined() {
      if (actual !== undefined) throw new Error(`Expected undefined but got ${actual}`);
    }
  };
}

// ---------------------------------------------------------
// 1. NAME FIELD VALIDATION
// ---------------------------------------------------------
console.log('--- Requirement 1: Name Fields (Letters and spaces only, no numbers/symbols) ---');

test('Valid: "john" (lowercase)', () => {
  const res = AuraBackend.Validators.name('john');
  expect(res.valid).toBe(true);
  expect(res.value).toBe('john');
});

test('Valid: "John" (capitalized)', () => {
  const res = AuraBackend.Validators.name('John');
  expect(res.valid).toBe(true);
  expect(res.value).toBe('John');
});

test('Valid: "John Doe" (spaces between names)', () => {
  const res = AuraBackend.Validators.name('John Doe');
  expect(res.valid).toBe(true);
  expect(res.value).toBe('John Doe');
});

test('Valid: "Mary Jane Watson" (multiple names with spaces)', () => {
  const res = AuraBackend.Validators.name('Mary Jane Watson');
  expect(res.valid).toBe(true);
});

test('Invalid: "john123" (contains numbers)', () => {
  const res = AuraBackend.Validators.name('john123');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('must not contain numbers');
});

test('Invalid: "12345" (numbers only)', () => {
  const res = AuraBackend.Validators.name('12345');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('must not contain numbers');
});

test('Invalid: "john@123" (special characters & numbers)', () => {
  const res = AuraBackend.Validators.name('john@123');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('must not contain numbers');
});

test('Invalid: "John_Doe" (contains underscore symbol)', () => {
  const res = AuraBackend.Validators.name('John_Doe');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('can only contain letters and spaces');
});

test('Invalid: "John!" (contains exclamation mark)', () => {
  const res = AuraBackend.Validators.name('John!');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('can only contain letters and spaces');
});

test('Invalid: empty string ""', () => {
  const res = AuraBackend.Validators.name('');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('is required');
});

test('Simulate input sanitization: stripping non-letters from "john123@#$ Doe"', () => {
  const rawInput = "john123@#$ Doe";
  const sanitized = rawInput.replace(/[^a-zA-Z\s]/g, '');
  expect(sanitized).toBe('john Doe');
  expect(AuraBackend.Validators.name(sanitized).valid).toBe(true);
});

// ---------------------------------------------------------
// 2. NUMBER & MOBILE FIELDS VALIDATION
// ---------------------------------------------------------
console.log('\n--- Requirement 2: Number / Mobile Fields (Numbers only, exactly 10 digits) ---');

test('Valid mobile: "9876543210" (exactly 10 digits)', () => {
  const res = AuraBackend.Validators.mobile('9876543210');
  expect(res.valid).toBe(true);
  expect(res.value).toBe('9876543210');
});

test('Valid mobile: "1234567890"', () => {
  const res = AuraBackend.Validators.mobile('1234567890');
  expect(res.valid).toBe(true);
});

test('Invalid mobile: "98765abc10" (contains alphabets)', () => {
  const res = AuraBackend.Validators.mobile('98765abc10');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('numbers only (no letters)');
});

test('Invalid mobile: "12345" (less than 10 digits)', () => {
  const res = AuraBackend.Validators.mobile('12345');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('exactly 10 digits');
});

test('Invalid mobile: "987654321099" (more than 10 digits)', () => {
  const res = AuraBackend.Validators.mobile('987654321099');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('exactly 10 digits');
});

test('Invalid mobile: "98765-43210" (contains hyphens/special chars)', () => {
  const res = AuraBackend.Validators.mobile('98765-43210');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('numbers only');
});

test('Invalid mobile: empty string ""', () => {
  const res = AuraBackend.Validators.mobile('');
  expect(res.valid).toBe(false);
  expect(res.error).toContain('is required');
});

test('Simulate mobile input filtering: stripping non-digits and truncating to 10', () => {
  const rawMobile = "98765-abc-43210-999";
  const sanitized = rawMobile.replace(/\D/g, '').slice(0, 10);
  expect(sanitized).toBe('9876543210');
  expect(AuraBackend.Validators.mobile(sanitized).valid).toBe(true);
});

test('Number field (Area estimator): only positive digits', () => {
  const validArea = AuraBackend.Validators.number('250', 'Area');
  expect(validArea.valid).toBe(true);
  expect(validArea.value).toBe(250);

  const invalidArea = AuraBackend.Validators.number('abc', 'Area');
  expect(invalidArea.valid).toBe(false);
  expect(invalidArea.error).toContain('numbers only');
});

// ---------------------------------------------------------
// 3. EMAIL FIELD VALIDATION
// ---------------------------------------------------------
console.log('\n--- Requirement 3: Email Fields (Mandatory @ and valid domain) ---');

test('Valid email: "ranjith@gmail.com"', () => {
  const res = AuraBackend.Validators.email('ranjith@gmail.com');
  expect(res.valid).toBe(true);
  expect(res.value).toBe('ranjith@gmail.com');
});

test('Valid email: "user@example.com"', () => {
  const res = AuraBackend.Validators.email('user@example.com');
  expect(res.valid).toBe(true);
});

test('Valid email: "john.doe+filter@domain.co.in"', () => {
  const res = AuraBackend.Validators.email('john.doe+filter@domain.co.in');
  expect(res.valid).toBe(true);
});

test('Invalid email: "johngmail.com" (missing @ symbol)', () => {
  const res = AuraBackend.Validators.email('johngmail.com');
  expect(res.valid).toBe(false);
  expect(res.error).toContain("must include an '@' symbol");
});

test('Invalid email: "john@" (missing domain after @)', () => {
  const res = AuraBackend.Validators.email('john@');
  expect(res.valid).toBe(false);
  expect(res.error).toContain("missing the domain after '@'");
});

test('Invalid email: "@gmail.com" (missing username before @)', () => {
  const res = AuraBackend.Validators.email('@gmail.com');
  expect(res.valid).toBe(false);
  expect(res.error).toContain("missing the username before '@'");
});

test('Invalid email: "john@gmail" (missing domain extension / TLD)', () => {
  const res = AuraBackend.Validators.email('john@gmail');
  expect(res.valid).toBe(false);
  expect(res.error).toContain("valid domain extension");
});

test('Invalid email: "john@.com" (invalid domain)', () => {
  const res = AuraBackend.Validators.email('john@.com');
  expect(res.valid).toBe(false);
  expect(res.error).toContain("valid email address");
});

test('Invalid email: empty string ""', () => {
  const res = AuraBackend.Validators.email('');
  expect(res.valid).toBe(false);
  expect(res.error).toContain("is required");
});

// ---------------------------------------------------------
// 4. REQUIRED FIELDS VALIDATION
// ---------------------------------------------------------
console.log('\n--- Requirement 4: Required Fields ---');

test('Contact form with all empty fields fails validation with distinct errors', () => {
  const emptyRes = AuraBackend.validateInquiry({});
  expect(emptyRes.isValid).toBe(false);
  expect(emptyRes.errors.name).toContain('Full name is required');
  expect(emptyRes.errors.email).toContain('Email is required');
  expect(emptyRes.errors.phone).toContain('Mobile number is required');
  expect(emptyRes.errors.service).toContain('Please select a service');
  expect(emptyRes.errors.message).toContain('Message is required');
});

test('Comment form with empty required fields fails validation', () => {
  const emptyCmt = AuraBackend.validateComment({});
  expect(emptyCmt.isValid).toBe(false);
  expect(emptyCmt.errors.name).toContain('Name is required');
  expect(emptyCmt.errors.comment).toContain('Comment is required');
});

// ---------------------------------------------------------
// 5. SECURITY & BACKEND PERSISTENCE
// ---------------------------------------------------------
console.log('\n--- Requirement 6: Security & Backend API Validation ---');

test('Invalid inquiry is strictly rejected with HTTP 400 and NOT stored in DB', () => {
  const initialCount = AuraBackend.getInquiries().length;
  const badPayload = {
    name: 'john123',
    email: 'johngmail.com',
    phone: '98765abc10',
    service: 'Fake Service',
    message: 'too short'
  };
  const response = AuraBackend.saveInquiry(badPayload);
  expect(response.success).toBe(false);
  expect(response.status).toBe(400);
  expect(response.statusText).toContain('Bad Request');
  // Check that database was NOT modified
  expect(AuraBackend.getInquiries().length).toBe(initialCount);
});

test('Valid inquiry is accepted with HTTP 200, sanitized, and stored in DB', () => {
  const initialCount = AuraBackend.getInquiries().length;
  const goodPayload = {
    name: 'Ranjith Kumar',
    email: 'ranjith@gmail.com',
    phone: '9876543210',
    service: 'False Ceiling',
    message: '<script>alert("xss")</script> Need false ceiling for 500 sq ft hall.'
  };
  const response = AuraBackend.saveInquiry(goodPayload);
  expect(response.success).toBe(true);
  expect(response.status).toBe(200);
  expect(response.data.name).toBe('Ranjith Kumar');
  expect(response.data.phone).toBe('9876543210');
  expect(response.data.email).toBe('ranjith@gmail.com');
  // Ensure XSS was sanitized
  expect(response.data.message).toContain('&lt;script&gt;');
  // Ensure saved to DB
  expect(AuraBackend.getInquiries().length).toBe(initialCount + 1);
});

test('Newsletter subscription backend validation & duplicate prevention', () => {
  const badSub = AuraBackend.saveSubscriber({ email: 'john@' });
  expect(badSub.success).toBe(false);
  expect(badSub.status).toBe(400);

  const goodSub = AuraBackend.saveSubscriber({ email: 'ranjith@gmail.com' });
  expect(goodSub.success).toBe(true);
  expect(goodSub.status).toBe(200);
  expect(AuraBackend.getSubscribers().some(s => s.email === 'ranjith@gmail.com')).toBe(true);
});

// ---------------------------------------------------------
// 6. HTML MARKUP AUDIT ACROSS ALL 12 HTML FILES
// ---------------------------------------------------------
console.log('\n--- Requirement: Audit all HTML files ---');

const htmlFiles = [
  '404.html',
  'about.html',
  'agency-home.html',
  'blog-detail.html',
  'blog.html',
  'coming-soon.html',
  'contact.html',
  'gallery.html',
  'index.html',
  'pricing.html',
  'service-detail.html',
  'services.html'
];

htmlFiles.forEach(file => {
  test(`File "${file}" loads backend-validator.js and main.js`, () => {
    const content = fs.readFileSync(file, 'utf8');
    expect(content.includes('assets/js/backend-validator.js')).toBe(true);
    expect(content.includes('assets/js/main.js')).toBe(true);
  });
});

test('contact.html contains strict form markup (pattern, maxlength, field-error)', () => {
  const content = fs.readFileSync('contact.html', 'utf8');
  expect(content.includes('id="contact-name"')).toBe(true);
  expect(content.includes('data-type="name"')).toBe(true);
  expect(content.includes('id="contact-phone"')).toBe(true);
  expect(content.includes('data-type="phone"')).toBe(true);
  expect(content.includes('maxlength="10"')).toBe(true);
  expect(content.includes('id="contact-email"')).toBe(true);
  expect(content.includes('data-type="email"')).toBe(true);
  expect(content.includes('data-error-for="name"')).toBe(true);
  expect(content.includes('data-error-for="email"')).toBe(true);
  expect(content.includes('data-error-for="phone"')).toBe(true);
});

test('blog-detail.html comment form contains name & comment validation markup', () => {
  const content = fs.readFileSync('blog-detail.html', 'utf8');
  expect(content.includes('data-comment-form')).toBe(true);
  expect(content.includes('name="comment_name"')).toBe(true);
  expect(content.includes('data-type="name"')).toBe(true);
  expect(content.includes('name="comment_text"')).toBe(true);
  expect(content.includes('data-error-for="comment_name"')).toBe(true);
  expect(content.includes('data-error-for="comment_text"')).toBe(true);
});

test('index.html & pricing.html estimators have numeric input modes', () => {
  const indexContent = fs.readFileSync('index.html', 'utf8');
  expect(indexContent.includes('name="area"')).toBe(true);
  expect(indexContent.includes('inputmode="numeric"')).toBe(true);

  const pricingContent = fs.readFileSync('pricing.html', 'utf8');
  expect(pricingContent.includes('name="p-area"')).toBe(true);
  expect(pricingContent.includes('inputmode="numeric"')).toBe(true);
});

console.log('\n================================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('================================================================');

if (totalTests !== passedTests) {
  process.exit(1);
}
