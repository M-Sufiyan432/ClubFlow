const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  familyId: {
    type: String,
    required: true,
    index: true
  },
  replacedByTokenHash: String,
  revokedAt: Date,
  revokedReason: String,
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  lastUsedAt: Date,
  createdByIp: String,
  lastUsedByIp: String,
  userAgent: String
}, {
  timestamps: true
});

refreshTokenSchema.index({ user: 1, sessionId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.virtual('isActive').get(function() {
  return !this.revokedAt && this.expiresAt > new Date();
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
