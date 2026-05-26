const QUEUE_NAMES = require('../queueNames');
const JOB_NAMES = require('../jobNames');
const { addJob } = require('../queueManager');
const { getJobOptions } = require('../retryStrategy');

const buildAttachmentScanJobId = ({ taskId, attachmentId }) =>
  `attachment-scan:${taskId}:${attachmentId}`;

const enqueueAttachmentScan = (payload, options = {}) => addJob(
  QUEUE_NAMES.ATTACHMENTS,
  JOB_NAMES.ATTACHMENT_SCAN,
  payload,
  getJobOptions('scan', {
    jobId: options.jobId || buildAttachmentScanJobId(payload),
    delay: options.delay,
    priority: options.priority || 2
  })
);

const enqueueAttachmentScanCleanup = (options = {}) => addJob(
  QUEUE_NAMES.ATTACHMENTS,
  JOB_NAMES.ATTACHMENT_SCAN_CLEANUP,
  {},
  getJobOptions('scheduled', options)
);

module.exports = {
  buildAttachmentScanJobId,
  enqueueAttachmentScan,
  enqueueAttachmentScanCleanup
};
