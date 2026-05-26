const IORedis = require('ioredis');
const { logger } = require('./logger');

const connections = new Set();
let connectionCount = 0;

const getNumberEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

const getRedisConnection = (options = {}) => {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const connectionName = options.connectionName || `clubflow:${process.pid}:${++connectionCount}`;
  const isTlsUrl = redisUrl.startsWith('rediss://');

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: options.enableReadyCheck ?? true,
    lazyConnect: options.lazyConnect ?? true,
    connectionName,
    connectTimeout: getNumberEnv('REDIS_CONNECT_TIMEOUT_MS', 20000),
    commandTimeout: getNumberEnv('REDIS_COMMAND_TIMEOUT_MS', 30000),
    keepAlive: getNumberEnv('REDIS_KEEP_ALIVE_MS', 30000),
    noDelay: true,
    ...(isTlsUrl ? { tls: {} } : {}),
    retryStrategy(times) {
      const baseDelay = Math.min(times * 250, getNumberEnv('REDIS_RETRY_MAX_DELAY_MS', 10000));
      const jitter = Math.floor(Math.random() * 250);
      return baseDelay + jitter;
    },
    reconnectOnError(error) {
      const message = error.message || '';
      if (message.includes('READONLY') || message.includes('ECONNRESET')) {
        return 2;
      }
      return false;
    }
  });

  connection.on('connect', () => logger.info(`Redis connection established: ${connectionName}`));
  connection.on('reconnecting', (delay) => logger.warn(`Redis reconnecting ${connectionName} in ${delay}ms`));
  connection.on('error', (error) => logger.error(`Redis error on ${connectionName}: ${error.message}`));
  connection.on('end', () => connections.delete(connection));

  connections.add(connection);
  return connection;
};

const closeRedisConnection = async () => {
  await Promise.all([...connections].map(async (connection) => {
    try {
      if (connection.status === 'end') return;
      await connection.quit();
    } catch (error) {
      logger.warn(`Redis quit failed for ${connection.options.connectionName}: ${error.message}`);
      connection.disconnect();
    }
  }));
  connections.clear();
};

module.exports = {
  getRedisConnection,
  closeRedisConnection
};
