const crypto = require('crypto');
const { logger, runWithLogContext, setLogContext } = require('../config/logger');

let otel;
try {
  otel = require('@opentelemetry/api');
} catch (error) {
  otel = null;
}

const requestIdHeader = 'x-request-id';

const getRequestId = (req) =>
  req.headers[requestIdHeader] ||
  req.headers['x-correlation-id'] ||
  crypto.randomUUID();

const getClubId = (req) =>
  req.params?.clubId ||
  req.body?.clubId ||
  req.body?.club ||
  req.headers['x-club-id'] ||
  null;

const requestContext = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  const requestId = String(getRequestId(req));
  const clubId = getClubId(req);
  const extractedContext = otel
    ? otel.propagation.extract(otel.context.active(), req.headers)
    : null;

  req.requestId = requestId;
  req.correlationId = requestId;
  req.clubId = req.clubId || clubId;
  res.setHeader(requestIdHeader, requestId);

  const store = {
    requestId,
    correlationId: requestId,
    clubId,
    userId: null,
    method: req.method,
    path: req.originalUrl
  };

  const run = () => {
    runWithLogContext(store, () => {
      const span = otel ? otel.trace.getSpan(otel.context.active()) : null;
      if (span) {
        span.setAttribute('clubflow.request_id', requestId);
        if (clubId) span.setAttribute('clubflow.club_id', String(clubId));
      }

      res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        const userId = req.user?._id?.toString() || req.user?.id || null;
        const resolvedClubId = getClubId(req) || req.club?._id?.toString() || req.clubId || null;

        setLogContext({ userId, clubId: resolvedClubId });
        logger.log(level, 'http.request.completed', {
          durationMs: Math.round(durationMs),
          statusCode: res.statusCode,
          contentLength: res.getHeader('content-length'),
          userAgent: req.get('user-agent'),
          ip: req.ip
        });
      });

      next();
    });
  };

  if (otel && extractedContext) {
    otel.context.with(extractedContext, run);
    return;
  }

  run();
};

module.exports = {
  requestContext,
  requestIdHeader
};
