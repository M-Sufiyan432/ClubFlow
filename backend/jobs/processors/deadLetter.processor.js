const JobFailure = require('../../models/JobFailure.model');

const processDeadLetterJob = async (job) => {
  const failure = job.data;

  await JobFailure.findOneAndUpdate(
    { queueName: failure.queueName, jobId: failure.jobId },
    { $set: failure },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = processDeadLetterJob;
