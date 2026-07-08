const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken.model');

const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || process.env.JWT_EXPIRE || '15m';
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createOpaqueToken = () => crypto.randomBytes(48).toString('base64url');

const getRefreshExpiry = () => new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

const createAccessToken = (user, sessionId) => jwt.sign(
  {
    id: user._id,
    email: user.email,
    role: user.role,
    sessionId,
    tokenVersion: user.tokenVersion || 0,
    typ: 'access'
  },
  process.env.JWT_SECRET,
  {
    expiresIn: ACCESS_TOKEN_EXPIRE,
    jwtid: crypto.randomUUID()
  }
);

const createRefreshTokenRecord = async ({
  user,
  sessionId = crypto.randomUUID(),
  familyId = crypto.randomUUID(),
  req
}) => {
  const refreshToken = createOpaqueToken();
  const tokenHash = hashToken(refreshToken);

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    sessionId,
    familyId,
    expiresAt: getRefreshExpiry(),
    createdByIp: req?.ip,
    lastUsedByIp: req?.ip,
    userAgent: req?.get?.('user-agent')
  });

  return {
    refreshToken,
    tokenHash,
    sessionId,
    familyId
  };
};

const issueTokenPair = async (user, req, existingSession = {}) => {
  const session = await createRefreshTokenRecord({
    user,
    req,
    sessionId: existingSession.sessionId,
    familyId: existingSession.familyId
  });

  return {
    accessToken: createAccessToken(user, session.sessionId),
    refreshToken: session.refreshToken,
    refreshTokenHash: session.tokenHash,
    sessionId: session.sessionId,
    familyId: session.familyId
  };
};

const rotateRefreshToken = async (refreshToken, req) => {
  const tokenHash = hashToken(refreshToken);
  const existing = await RefreshToken.findOne({ tokenHash }).populate('user');

  if (!existing) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  if (existing.revokedAt) {
    await RefreshToken.updateMany(
      { familyId: existing.familyId, revokedAt: null },
      { revokedAt: new Date(), revokedReason: 'reuse_detected' }
    );
    const error = new Error('Refresh token reuse detected');
    error.statusCode = 401;
    throw error;
  }

  if (existing.expiresAt <= new Date()) {
    const error = new Error('Refresh token expired');
    error.statusCode = 401;
    throw error;
  }

  if (!existing.user?.isActive) {
    const error = new Error('User session is not active');
    error.statusCode = 401;
    throw error;
  }

  const nextPair = await issueTokenPair(existing.user, req, {
    sessionId: existing.sessionId,
    familyId: existing.familyId
  });

  existing.revokedAt = new Date();
  existing.revokedReason = 'rotated';
  existing.replacedByTokenHash = nextPair.refreshTokenHash;
  existing.lastUsedAt = new Date();
  existing.lastUsedByIp = req?.ip;
  await existing.save();

  return {
    ...nextPair,
    user: existing.user
  };
};

const revokeSession = (sessionId, reason = 'logout') =>
  RefreshToken.updateMany(
    { sessionId, revokedAt: null },
    { revokedAt: new Date(), revokedReason: reason }
  );

const revokeRefreshToken = (refreshToken, reason = 'logout') =>
  RefreshToken.updateOne(
    { tokenHash: hashToken(refreshToken), revokedAt: null },
    { revokedAt: new Date(), revokedReason: reason }
  );

const revokeAllUserSessions = async (userId, reason = 'global_logout') => {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date(), revokedReason: reason }
  );
};

const listUserSessions = (userId) =>
  RefreshToken.aggregate([
    {
      $match: {
        user: userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() }
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$sessionId',
        createdAt: { $first: '$createdAt' },
        lastUsedAt: { $max: '$lastUsedAt' },
        expiresAt: { $max: '$expiresAt' },
        userAgent: { $first: '$userAgent' },
        lastUsedByIp: { $first: '$lastUsedByIp' }
      }
    },
    { $sort: { createdAt: -1 } }
  ]);

module.exports = {
  createAccessToken,
  hashToken,
  issueTokenPair,
  listUserSessions,
  revokeAllUserSessions,
  revokeRefreshToken,
  revokeSession,
  rotateRefreshToken
};
