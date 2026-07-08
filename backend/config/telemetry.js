let api;
let NodeSDK;
let getNodeAutoInstrumentations;
let OTLPTraceExporter;

try {
  api = require('@opentelemetry/api');
  ({ NodeSDK } = require('@opentelemetry/sdk-node'));
  ({ getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node'));
  ({ OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http'));
} catch (error) {
  api = null;
}

let sdk;

const isTelemetryEnabled = () => Boolean(api && process.env.OTEL_ENABLED !== 'false');

const initTelemetry = () => {
  if (!isTelemetryEnabled() || sdk) return sdk;

  sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'clubflow-api',
    traceExporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? new OTLPTraceExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')}/v1/traces`
        })
      : undefined,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false }
      })
    ]
  });

  sdk.start();
  return sdk;
};

const shutdownTelemetry = async () => {
  if (sdk) await sdk.shutdown();
};

const getTraceContext = () => {
  if (!api) return {};
  const span = api.trace.getSpan(api.context.active());
  const spanContext = span?.spanContext();

  return spanContext
    ? {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId
      }
    : {};
};

module.exports = {
  getTraceContext,
  initTelemetry,
  isTelemetryEnabled,
  shutdownTelemetry
};
