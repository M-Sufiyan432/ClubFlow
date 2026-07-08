let Sentry;

try {
  Sentry = require('@sentry/node');
} catch (error) {
  Sentry = null;
}

const isSentryEnabled = () => Boolean(Sentry && process.env.SENTRY_DSN);

const initSentry = () => {
  if (!isSentryEnabled()) return null;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    sendDefaultPii: false
  });

  return Sentry;
};

const sentryRequestContext = (req, res, next) => {
  if (!isSentryEnabled()) return next();

  Sentry.getCurrentScope().setTags({
    requestId: req.requestId,
    clubId: req.clubId || req.headers['x-club-id']
  });

  Sentry.getCurrentScope().setContext('request', {
    id: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });

  if (req.user) {
    Sentry.getCurrentScope().setUser({
      id: req.user._id?.toString() || req.user.id,
      email: req.user.email,
      username: req.user.name
    });
  }

  next();
};

const captureException = (error, context = {}) => {
  if (!isSentryEnabled()) return;

  Sentry.withScope((scope) => {
    if (context.userId) scope.setUser({ id: String(context.userId) });
    if (context.tags) scope.setTags(context.tags);
    Object.entries(context.extra || {}).forEach(([key, value]) => scope.setExtra(key, value));
    Sentry.captureException(error);
  });
};

module.exports = {
  captureException,
  initSentry,
  isSentryEnabled,
  sentryRequestContext
};
