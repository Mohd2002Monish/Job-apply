const test = require('node:test');
const assert = require('node:assert');
const { createJobSchema, updateJobSchema, profileUpdateSchema } = require('../middlewares/validate');

test.describe('Jobs Input Validation & Schema Tests', () => {
  
  test('createJobSchema - should pass with valid job data', () => {
    const validData = {
      job: 'Software Engineer',
      email: 'hr@google.com',
      description: 'We are hiring a Software Engineer with Node.js experience.',
      hrName: 'Sundar Pichai',
      companyName: 'Google',
      emailProvider: 'google',
      templateId: 'classic'
    };

    const parsed = createJobSchema.safeParse(validData);
    assert.strictEqual(parsed.success, true);
  });

  test('createJobSchema - should fail if required fields are missing', () => {
    const invalidData = {
      hrName: 'Sundar Pichai'
    };

    const parsed = createJobSchema.safeParse(invalidData);
    assert.strictEqual(parsed.success, false);
    
    const errors = parsed.error.format();
    assert.ok(errors.job);
    assert.ok(errors.email);
    assert.ok(errors.description);
  });

  test('createJobSchema - should fail with invalid email format', () => {
    const invalidData = {
      job: 'Software Engineer',
      email: 'invalid-email-address',
      description: 'Hiring developers'
    };

    const parsed = createJobSchema.safeParse(invalidData);
    assert.strictEqual(parsed.success, false);
    assert.match(parsed.error.errors[0].message, /valid email/i);
  });

  test('updateJobSchema - should allow partial fields and validate status enum', () => {
    const validUpdate = {
      status: 'interview',
      followUpStatus: 'pending'
    };
    const parsedValid = updateJobSchema.safeParse(validUpdate);
    assert.strictEqual(parsedValid.success, true);

    const invalidUpdate = {
      status: 'not-a-valid-status'
    };
    const parsedInvalid = updateJobSchema.safeParse(invalidUpdate);
    assert.strictEqual(parsedInvalid.success, false);
  });
});

test.describe('Search Query Regex Escaping Logic', () => {
  test('Should escape special regex characters to prevent ReDoS injection', () => {
    const searchStr = 'React (Developer)*+?';
    
    const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const safeSearch = escapeRegex(searchStr);

    assert.strictEqual(safeSearch, 'React \\(Developer\\)\\*\\+\\?');
    
    const regex = new RegExp(safeSearch, 'i');
    assert.ok(regex.test('React (Developer)*+?'));
    assert.ok(!regex.test('React Developer'));
  });
});
