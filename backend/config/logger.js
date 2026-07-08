const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { AsyncLocalStorage } = require('async_hooks');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const asyncLocalStorage = new AsyncLocalStorage();

const redact = winston.format((info) => {
  const redactKeys = ['authorization', 'cookie', 'password', 'token', 'accessToken', 'refreshToken'];

  const scrub = (value) => {
    if (!value || typeof value !== 'object') return value;

    return Object.entries(value).reduce((next, [key, child]) => {
      next[key] = redactKeys.includes(key.toLowerCase()) ? '[REDACTED]' : scrub(child);
      return next;
    }, Array.isArray(value) ? [] : {});
  };

  Object.assign(info, scrub(info));
  return info;
});

const contextFormat = winston.format((info) => {
  const context = asyncLocalStorage.getStore();
  if (!context) return info;

  return {
    ...context,
    ...info
  };
});

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  contextFormat(),
  redact(),
  winston.format.json()
);

const consoleFormat = process.env.LOG_PRETTY === 'true'
  ? winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, requestId, userId, clubId, durationMs }) => {
        const ids = [requestId && `request=${requestId}`, userId && `user=${userId}`, clubId && `club=${clubId}`]
          .filter(Boolean)
          .join(' ');
        const timing = durationMs !== undefined ? ` duration=${durationMs}ms` : '';
        return `${timestamp} ${level}: ${message}${ids ? ` ${ids}` : ''}${timing}`;
      })
    )
  : baseFormat;

const transports = [
  new winston.transports.Console({ format: consoleFormat }),
  new winston.transports.File({
    filename: path.join(logsDir, 'app.log'),
    maxsize: 5242880,
    maxFiles: 5
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5
  })
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: process.env.OTEL_SERVICE_NAME || 'clubflow-api',
    environment: process.env.NODE_ENV || 'development'
  },
  format: baseFormat,
  transports,
  exitOnError: false
});

const runWithLogContext = (context, callback) => asyncLocalStorage.run(context, callback);

const setLogContext = (patch = {}) => {
  const context = asyncLocalStorage.getStore();
  if (context) Object.assign(context, patch);
};

const getLogContext = () => asyncLocalStorage.getStore() || {};

const morganStream = {
  write: (message) => {
    logger.info('http.access', { raw: message.trim() });
  }
};

module.exports = {
  getLogContext,
  logger,
  morganStream,
  runWithLogContext,
  setLogContext
};
