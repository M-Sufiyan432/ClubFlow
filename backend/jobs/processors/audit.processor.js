const AuditLog = require('../../models/AuditLog.model');

const processAuditJob = async (job) => {
  const { user, action, entityType, entityId, description } = job.data;

  if (!user || !action || !entityType || !entityId || !description) {
    throw new Error('Audit job requires user, action, entityType, entityId, and description');
  }

  return AuditLog.logAction(job.data);
};

module.exports = processAuditJob;
