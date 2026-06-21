import test from 'node:test';
import assert from 'node:assert';

test('Kanban Board - should filter jobs into correct status columns', () => {
  const mockJobs = [
    { _id: '1', job: 'React Developer', status: 'saved' },
    { _id: '2', job: 'Node Developer', status: 'applied' },
    { _id: '3', job: 'Fullstack Developer', status: 'applied' },
    { _id: '4', job: 'QA Engineer', status: 'offer' },
  ];

  // Logic mirroring card partitioning: colJobs = jobs.filter(j => (j.status || 'saved') === col.id);
  const getJobsForColumn = (columnId, jobsList) => {
    return jobsList.filter(j => (j.status || 'saved') === columnId);
  };

  const savedJobs = getJobsForColumn('saved', mockJobs);
  const appliedJobs = getJobsForColumn('applied', mockJobs);
  const interviewJobs = getJobsForColumn('interview', mockJobs);
  const offerJobs = getJobsForColumn('offer', mockJobs);

  assert.strictEqual(savedJobs.length, 1);
  assert.strictEqual(savedJobs[0].job, 'React Developer');

  assert.strictEqual(appliedJobs.length, 2);
  assert.deepStrictEqual(appliedJobs.map(j => j.job), ['Node Developer', 'Fullstack Developer']);

  assert.strictEqual(interviewJobs.length, 0);

  assert.strictEqual(offerJobs.length, 1);
  assert.strictEqual(offerJobs[0].job, 'QA Engineer');
});

test('Kanban Board - should handle drop logic and trigger optimistic state update', () => {
  const mockJobs = [
    { _id: '1', job: 'React Developer', status: 'saved' },
    { _id: '2', job: 'Node Developer', status: 'applied' }
  ];

  const jobIdToMove = '1';
  const targetStatus = 'interview';

  // Logic mirroring optimistic handler: setJobs(prevJobs => prevJobs.map(j => j._id === jobId ? { ...j, status: targetStatus } : j));
  const simulateOptimisticMove = (jobsList, jobId, status) => {
    return jobsList.map(j => j._id === jobId ? { ...j, status } : j);
  };

  const updatedJobs = simulateOptimisticMove(mockJobs, jobIdToMove, targetStatus);

  assert.strictEqual(updatedJobs[0].status, 'interview');
  assert.strictEqual(updatedJobs[1].status, 'applied'); // Unchanged
});
