const { getLogContext } = require('../config/logger');

let otel;
try {
  otel = require('@opentelemetry/api');
} catch (error) {
  otel = null;
}

const TRACE_CONTEXT_FIELD = '_traceContext';
const CORRELATION_FIELD = '_correlation';

const withProducerContext = (data = {}) => {
  const carrier = {};
  if (otel) {
    otel.propagation.inject(otel.context.active(), carrier);
  }
  const logContext = getLogContext();

  return {
    ...data,
    [TRACE_CONTEXT_FIELD]: carrier,
    [CORRELATION_FIELD]: {
      requestId: logContext.requestId,
      correlationId: logContext.correlationId,
      userId: logContext.userId,
      clubId: logContext.clubId
    }
  };
};

const runJobWithTrace = async (queueName, job, handler) => {
  if (!otel) return handler(job);

  const extractedContext = otel.propagation.extract(
    otel.context.active(),
    job.data?.[TRACE_CONTEXT_FIELD] || {}
  );
  const tracer = otel.trace.getTracer('clubflow-workers');

  return otel.context.with(extractedContext, () =>
    tracer.startActiveSpan(`bullmq ${queueName} ${job.name}`, async (span) => {
      try {
        span.setAttributes({
          'messaging.system': 'bullmq',
          'messaging.destination.name': queueName,
          'messaging.operation': 'process',
          'messaging.message.id': String(job.id),
          'clubflow.request_id': job.data?.[CORRELATION_FIELD]?.requestId || ''
        });

        return await handler(job);
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    })
  );
};

module.exports = {
  CORRELATION_FIELD,
  TRACE_CONTEXT_FIELD,
  runJobWithTrace,
  withProducerContext
};
