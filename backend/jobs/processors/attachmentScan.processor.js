const Task = require('../../models/Task.model');
const JOB_NAMES = require('../jobNames');
const { scanStorageObject } = require('../../services/virusScanner.service');

const getAttachment = (task, attachmentId) =>
  task.attachments.id(attachmentId);

const updateAttachmentScan = async ({ taskId, attachmentId, updates }) => {
  await Task.updateOne(
    { _id: taskId, 'attachments._id': attachmentId },
    { $set: Object.entries(updates).reduce((acc, [key, value]) => {
      acc[`attachments.$.${key}`] = value;
      return acc;
    }, {}) }
  );
};

const scanAttachment = async (job) => {
  const { taskId, attachmentId } = job.data;

  if (!taskId || !attachmentId) {
    throw new Error('Attachment scan job requires taskId and attachmentId');
  }

  const task = await Task.findById(taskId).select('attachments');
  if (!task) {
    return { skipped: true, reason: 'task_not_found' };
  }

  const attachment = getAttachment(task, attachmentId);
  if (!attachment) {
    return { skipped: true, reason: 'attachment_not_found' };
  }

  if (attachment.scanStatus === 'safe' || attachment.scanStatus === 'infected' || attachment.scanStatus === 'blocked') {
    return { skipped: true, reason: `already_${attachment.scanStatus}` };
  }

  if (attachment.storageProvider !== 's3' || !attachment.storageKey) {
    await updateAttachmentScan({
      taskId,
      attachmentId,
      updates: {
        scanStatus: 'failed',
        scanProvider: process.env.ATTACHMENT_SCAN_PROVIDER || 'noop',
        scanDetails: { reason: 'Only private S3 attachments can be scanned by this worker' },
        scannedAt: new Date()
      }
    });
    return { skipped: true, reason: 'unsupported_storage_provider' };
  }

  await updateAttachmentScan({
    taskId,
    attachmentId,
    updates: {
      scanStatus: 'scanning',
      scanJobId: String(job.id)
    }
  });

  const result = await scanStorageObject({
    storageKey: attachment.storageKey,
    filename: attachment.filename
  });

  const infected = result.status === 'infected';
  await updateAttachmentScan({
    taskId,
    attachmentId,
    updates: {
      scanStatus: infected ? 'infected' : 'safe',
      scanProvider: result.provider,
      scanDetails: result.raw,
      scannedAt: new Date(),
      quarantineReason: result.signature || undefined
    }
  });

  return {
    infected,
    provider: result.provider
  };
};

const cleanupStaleAttachmentScans = async () => {
  const staleMinutes = Number(process.env.ATTACHMENT_SCAN_STALE_MINUTES || 60);
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);

  const result = await Task.updateMany(
    {
      attachments: {
        $elemMatch: {
          scanStatus: { $in: ['pending', 'queued', 'scanning'] },
          uploadedAt: { $lt: cutoff }
        }
      }
    },
    {
      $set: {
        'attachments.$[attachment].scanStatus': 'failed',
        'attachments.$[attachment].scanDetails': {
          reason: 'Attachment scan did not complete before stale timeout'
        },
        'attachments.$[attachment].scannedAt': new Date()
      }
    },
    {
      arrayFilters: [{
        'attachment.scanStatus': { $in: ['pending', 'queued', 'scanning'] },
        'attachment.uploadedAt': { $lt: cutoff }
      }]
    }
  );

  return {
    modifiedCount: result.modifiedCount
  };
};

const processAttachmentJob = async (job) => {
  switch (job.name) {
    case JOB_NAMES.ATTACHMENT_SCAN:
      return scanAttachment(job);
    case JOB_NAMES.ATTACHMENT_SCAN_CLEANUP:
      return cleanupStaleAttachmentScans();
    default:
      throw new Error(`Unknown attachment job: ${job.name}`);
  }
};

module.exports = processAttachmentJob;
