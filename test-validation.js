const AuraBackend = require('./assets/js/backend-validator.js');
const { Validators, validateInquiry, validateNewsletter, saveInquiry, saveSubscriber, getInquiries, getSubscribers } = AuraBackend;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('--- 1. Testing Name Fields ---');
// Valid names
assert(Validators.name('john').valid === true, 'Accept lowercase "john"');
assert(Validators.name('John').valid === true, 'Accept uppercase/capitalized "John"');
assert(Validators.name('John Doe').valid === true, 'Accept spaces between names "John Doe"');
assert(Validators.name('Mary Jane Watson').valid === true, 'Accept multiple names "Mary Jane Watson"');

// Invalid names
assert(Validators.name('john123').valid === false, 'Reject numbers "john123"');
assert(Validators.name('12345').valid === false, 'Reject numbers only "12345"');
assert(Validators.name('john@123').valid === false, 'Reject special characters and numbers "john@123"');
assert(Validators.name('John_Doe').valid === false, 'Reject underscore "John_Doe"');
assert(Validators.name('John!').valid === false, 'Reject exclamation "John!"');
assert(Validators.name('').valid === false, 'Reject empty name');
assert(Validators.name('   ').valid === false, 'Reject whitespace only name');

console.log('\n--- 2. Testing Number Fields (Mobile) ---');
// Valid mobile
assert(Validators.mobile('9876543210').valid === true, 'Accept 10 digits "9876543210"');
assert(Validators.mobile('1234567890').valid === true, 'Accept 10 digits "1234567890"');

// Invalid mobile
assert(Validators.mobile('98765abc10').valid === false, 'Reject alphabets in mobile "98765abc10"');
assert(Validators.mobile('12345').valid === false, 'Reject less than 10 digits "12345"');
assert(Validators.mobile('987654321000').valid === false, 'Reject more than 10 digits "987654321000"');
assert(Validators.mobile('98765-43210').valid === false, 'Reject symbols in mobile "98765-43210"');
assert(Validators.mobile('').valid === false, 'Reject empty mobile number');

console.log('\n--- 3. Testing Email Fields ---');
// Valid email
assert(Validators.email('ranjith@gmail.com').valid === true, 'Accept "ranjith@gmail.com"');
assert(Validators.email('user@example.com').valid === true, 'Accept "user@example.com"');
assert(Validators.email('john.doe@company.co.uk').valid === true, 'Accept subdomains "john.doe@company.co.uk"');

// Invalid email
assert(Validators.email('johngmail.com').valid === false, 'Reject without @ "johngmail.com"');
assert(Validators.email('john@').valid === false, 'Reject without domain "john@"');
assert(Validators.email('@gmail.com').valid === false, 'Reject without local username "@gmail.com"');
assert(Validators.email('john@gmail').valid === false, 'Reject without TLD/domain extension "john@gmail"');
assert(Validators.email('john@.com').valid === false, 'Reject empty domain name "john@.com"');
assert(Validators.email('').valid === false, 'Reject empty email');

console.log('\n--- 4. Testing Required Fields & Full Inquiry Validation ---');
// Empty fields
const emptyInquiry = validateInquiry({});
assert(emptyInquiry.isValid === false, 'Reject completely empty inquiry form');
assert(Boolean(emptyInquiry.errors.name), 'Flags missing name');
assert(Boolean(emptyInquiry.errors.email), 'Flags missing email');
assert(Boolean(emptyInquiry.errors.phone), 'Flags missing phone');
assert(Boolean(emptyInquiry.errors.service), 'Flags missing service');
assert(Boolean(emptyInquiry.errors.message), 'Flags missing message');

// Invalid form submission
const invalidInquiry = validateInquiry({
  name: 'john123',
  email: 'john@gmail',
  phone: '98765abc10',
  service: 'False Ceiling',
  message: 'short'
});
assert(invalidInquiry.isValid === false, 'Reject invalid form submission');
assert(invalidInquiry.errors.name.includes('numbers'), 'Name error mentions numbers');
assert(invalidInquiry.errors.email.includes('domain extension'), 'Email error mentions domain extension');
assert(invalidInquiry.errors.phone.includes('numbers only'), 'Phone error mentions numbers only');
assert(invalidInquiry.errors.message.includes('at least 10 characters'), 'Message error mentions min length');

// Valid form submission
const validInquiry = validateInquiry({
  name: 'Ranjith Kumar',
  email: 'ranjith@gmail.com',
  phone: '9876543210',
  service: 'False Ceiling',
  message: 'I want a modern false ceiling for my 3BHK living room.'
});
assert(validInquiry.isValid === true, 'Accept valid form submission');
assert(Object.keys(validInquiry.errors).length === 0, 'No errors in valid inquiry');

console.log('\n--- 5. Security & Backend Database Persistence ---');
// Ensure invalid data is NEVER saved to database
const initialInqCount = getInquiries().length;
const badSave = saveInquiry({
  name: 'john123',
  email: 'bad-email',
  phone: '123',
  service: 'Invalid Service',
  message: ''
});
assert(badSave.success === false, 'Backend rejects invalid data');
assert(badSave.status === 400, 'Returns HTTP 400 status code');
assert(getInquiries().length === initialInqCount, 'Database is NOT modified with invalid data');

// Good save
const goodSave = saveInquiry({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '9876543210',
  service: 'False Ceiling',
  message: 'Looking for a quotation on acoustic ceiling grids.'
});
assert(goodSave.success === true, 'Backend accepts valid data');
assert(goodSave.status === 200, 'Returns HTTP 200 status code');
assert(getInquiries().length === initialInqCount + 1, 'Valid record successfully committed to database');

console.log('\n--- 6. Newsletter Subscription Validation & DB ---');
const badNews = saveSubscriber({ email: 'johngmail.com' });
assert(badNews.success === false, 'Reject newsletter email without @');
const goodNews = saveSubscriber({ email: 'ranjith@gmail.com' });
assert(goodNews.success === true, 'Accept valid newsletter email');
assert(getSubscribers().some(s => s.email === 'ranjith@gmail.com'), 'Subscriber saved to database');

console.log(`\n========================================`);
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
