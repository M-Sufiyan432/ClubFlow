const mongoose = require('mongoose');

const jobFailureSchema = new mongoose.Schema({
  queueName: {
    type: String,
    required: true,
    index: true
  },
  jobName: {
    type: String,
    required: true,
    index: true
  },
  jobId: {
    type: String,
    required: true,
    index: true
  },
  attemptsMade: {
    type: Number,
    default: 0
  },
  failedReason: String,
  stacktrace: [String],
  payload: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['open', 'replayed', 'ignored'],
    default: 'open',
    index: true
  },
  failedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

jobFailureSchema.index({ queueName: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('JobFailure', jobFailureSchema);
