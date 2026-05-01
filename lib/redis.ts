import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://default:y6EYTke5bEHCsp4OoyqHQlkRm2zCvWwr@redis-17772.crce286.ap-south-1-1.ec2.cloud.redislabs.com:17772';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
