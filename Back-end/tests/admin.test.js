const test = require('node:test');
const assert = require('node:assert');
const { requireOwner } = require('../middlewares/authMiddleware');
const { getAdminStats, getAdminUsers, updateUserRole, updateUserSubscription } = require('../controllers/adminController');

// Mock request and response
const mockRequest = (params = {}, body = {}, user = {}) => ({
  params,
  body,
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

test.describe('Admin Dashboard and RBAC Tests', () => {
  test('requireOwner - should block non-owners', () => {
    const req = mockRequest({}, {}, { email: 'user@example.com', role: 'user' });
    const res = mockResponse();
    let nextCalled = false;
    requireOwner(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
    assert.match(res.jsonData.error, /access denied/i);
  });

  test('requireOwner - should allow owners', () => {
    const req = mockRequest({}, {}, { email: 'owner@example.com', role: 'owner' });
    const res = mockResponse();
    let nextCalled = false;
    requireOwner(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.statusCode, undefined);
  });

  test('getAdminStats - should aggregate total database metrics', async () => {
    const req = mockRequest({}, {}, { email: 'owner@example.com', role: 'owner' });
    const res = mockResponse();

    const User = require('../models/User');
    const Job = require('../models/Job');

    const originalCountUsers = User.countDocuments;
    const originalCountJobs = Job.countDocuments;
    const originalAggregate = User.aggregate;

    User.countDocuments = async (query) => {
      if (query && query.subscriptionTier === 'pro') return 2;
      return 10;
    };
    Job.countDocuments = async () => 15;
    User.aggregate = async () => [{ promptTokens: 100, completionTokens: 50, totalTokens: 150 }];

    await getAdminStats(req, res);

    // Restore
    User.countDocuments = originalCountUsers;
    Job.countDocuments = originalCountJobs;
    User.aggregate = originalAggregate;

    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.stats.totalUsers, 10);
    assert.strictEqual(res.jsonData.stats.proUsers, 2);
    assert.strictEqual(res.jsonData.stats.totalJobs, 15);
    assert.strictEqual(res.jsonData.stats.promptTokens, 100);
    assert.strictEqual(res.jsonData.stats.completionTokens, 50);
    assert.strictEqual(res.jsonData.stats.totalTokens, 150);
  });

  test('getAdminUsers - should list all users with job count and token metrics', async () => {
    const req = mockRequest({}, {}, { email: 'owner@example.com', role: 'owner' });
    const res = mockResponse();

    const User = require('../models/User');
    const Job = require('../models/Job');

    const originalFind = User.find;
    const originalCountJobs = Job.countDocuments;

    User.find = () => ({
      sort: () => [
        {
          _id: 'user_1',
          name: 'Alice',
          email: 'alice@example.com',
          subscriptionTier: 'pro',
          aiRequestCount: 5,
          role: 'user',
          tokenUsage: { promptTokens: 80, completionTokens: 40, totalTokens: 120 },
          createdAt: new Date()
        }
      ]
    });
    Job.countDocuments = async () => 3;

    await getAdminUsers(req, res);

    // Restore
    User.find = originalFind;
    Job.countDocuments = originalCountJobs;

    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.users.length, 1);
    assert.strictEqual(res.jsonData.users[0].name, 'Alice');
    assert.strictEqual(res.jsonData.users[0].jobCount, 3);
    assert.strictEqual(res.jsonData.users[0].tokenUsage.totalTokens, 120);
  });
});
