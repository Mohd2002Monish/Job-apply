const test = require('node:test');
const assert = require('node:assert');
const { checkLimits } = require('../middlewares/subscriptionMiddleware');

// Mock request and response builders to isolate middleware and database lifecycles
const mockRequest = (body = {}, query = {}, user = {}) => ({
  body,
  query,
  user,
});

const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

test.describe('API Request Lifecycle & Limit Checks (E2E Integration)', () => {
  test('checkLimits - should block job creation if free tier limit is reached', async () => {
    // Mock user with free tier and 5 jobs already tracked
    const req = mockRequest(
      { job: 'Software Engineer', email: 'hr@google.com', description: 'React and Node' },
      {},
      { _id: 'user_123', subscriptionTier: 'free' }
    );
    const res = mockResponse();

    // Mock Job.countDocuments to return 5
    const Job = require('../models/Job');
    const originalCount = Job.countDocuments;
    Job.countDocuments = async () => 5;

    let nextCalled = false;
    const middleware = checkLimits('job');
    await middleware(req, res, () => { nextCalled = true; });

    // Restore original mock
    Job.countDocuments = originalCount;

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonData.limitExceeded, true);
    assert.match(res.jsonData.error, /limit reached/i);
  });

  test('checkLimits - should allow job creation if free tier limit is NOT reached', async () => {
    const req = mockRequest(
      { job: 'Software Engineer', email: 'hr@google.com', description: 'React and Node' },
      {},
      { _id: 'user_123', subscriptionTier: 'free' }
    );
    const res = mockResponse();

    const Job = require('../models/Job');
    const originalCount = Job.countDocuments;
    Job.countDocuments = async () => 2; // only 2 jobs tracked

    let nextCalled = false;
    const middleware = checkLimits('job');
    await middleware(req, res, () => { nextCalled = true; });

    Job.countDocuments = originalCount;

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.statusCode, undefined); // next called, so status not set on response
  });

  test('checkLimits - should allow job creation on Pro tier regardless of count', async () => {
    const req = mockRequest(
      { job: 'Software Engineer', email: 'hr@google.com', description: 'React and Node' },
      {},
      { _id: 'user_123', subscriptionTier: 'pro' }
    );
    const res = mockResponse();

    let nextCalled = false;
    const middleware = checkLimits('job');
    await middleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
  });

  test('checkLimits - should block AI request if free tier limit is reached', async () => {
    const req = mockRequest(
      {},
      {},
      { _id: 'user_123', subscriptionTier: 'free', aiRequestCount: 3 }
    );
    const res = mockResponse();

    let nextCalled = false;
    const middleware = checkLimits('ai');
    await middleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonData.limitExceeded, true);
    assert.match(res.jsonData.error, /AI usage limit reached/i);
  });
});
