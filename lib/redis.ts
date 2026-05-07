import Redis from 'ioredis';

// Graceful Redis connection - app works even if Redis is not available locally
let redisConnection: Redis | null = null;

try {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  const options = {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  };

  const client = redisUrl 
    ? new Redis(redisUrl, options)
    : new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        ...options
      });

  client.on('error', () => {
    // Suppress Redis errors silently in dev (no Redis installed locally)
  });

  redisConnection = client;
} catch (e) {
  // Redis not available - features that need Redis will be gracefully skipped
}

export { redisConnection };
export default redisConnection;
