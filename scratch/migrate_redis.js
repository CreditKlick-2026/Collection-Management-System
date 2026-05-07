/**
 * Redis Data Migration Script
 * Copies all keys from Old Redis to New Upstash Redis
 * 
 * Run with: node scratch/migrate_redis.js
 */

const Redis = require('ioredis');

// Old Redis (Redis Cloud)
const oldRedisUrl = "redis://default:y6EYTke5bEHCsp4OoyqHQlkRm2zCvWwr@redis-17772.crce286.ap-south-1-1.ec2.cloud.redislabs.com:17772";

// New Redis (Upstash from .env)
const newRedisUrl = "rediss://default:gQAAAAAAAcloAAIgcDI4ODFkZWUyODEzNmM0ZDg3OTZhN2JmNDdiNWFmMzVlZQ@subtle-macaque-117096.upstash.io:6379";

const oldClient = new Redis(oldRedisUrl);
const newClient = new Redis(newRedisUrl);

async function migrateData() {
  console.log('🔄 Starting Redis Data Migration...\n');

  try {
    console.log('Testing connection to Old Redis...');
    await oldClient.ping();
    console.log('✅ Connected to Old Redis');

    console.log('Testing connection to New Redis...');
    await newClient.ping();
    console.log('✅ Connected to New Redis\n');

    // Use SCAN instead of KEYS * to ensure we get absolutely everything
    console.log('🔍 Scanning Old Redis for all keys...');
    
    let keys = [];
    const stream = oldClient.scanStream({ match: '*', count: 100 });
    
    await new Promise((resolve, reject) => {
      stream.on('data', (resultKeys) => {
        keys.push(...resultKeys);
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    // Remove duplicates just in case
    keys = [...new Set(keys)];

    console.log(`📦 Found ${keys.length} unique keys in Old Redis.`);

    if (keys.length === 0) {
      console.log('\n✨ No data to migrate (the 2.1MB memory is likely just Redis internal engine overhead).');
      process.exit(0);
    }

    console.log('\nKeys found:');
    for (const key of keys) {
      const type = await oldClient.type(key);
      console.log(`  - ${key} (${type})`);
    }
    console.log('');

    let migrated = 0;
    let failed = 0;

    for (const key of keys) {
      try {
        const type = await oldClient.type(key);
        const ttl = await oldClient.pttl(key);
        
        switch (type) {
          case 'string': {
            const value = await oldClient.get(key);
            if (ttl > 0) {
              await newClient.set(key, value, 'PX', ttl);
            } else {
              await newClient.set(key, value);
            }
            break;
          }
          case 'hash': {
            const hash = await oldClient.hgetall(key);
            await newClient.hset(key, hash);
            if (ttl > 0) await newClient.pexpire(key, ttl);
            break;
          }
          case 'list': {
            const list = await oldClient.lrange(key, 0, -1);
            if (list.length > 0) {
              await newClient.del(key); // Clear existing if any
              await newClient.rpush(key, ...list);
              if (ttl > 0) await newClient.pexpire(key, ttl);
            }
            break;
          }
          case 'set': {
            const set = await oldClient.smembers(key);
            if (set.length > 0) {
              await newClient.sadd(key, ...set);
              if (ttl > 0) await newClient.pexpire(key, ttl);
            }
            break;
          }
          default:
            console.log(`⚠️  Skipped key '${key}' (Unsupported type: ${type})`);
            continue;
        }

        migrated++;
        process.stdout.write(`\r🚀 Progress: ${migrated}/${keys.length} keys migrated`);
      } catch (err) {
        console.error(`\n❌ Failed to migrate key '${key}':`, err.message);
        failed++;
      }
    }

    console.log('\n\n🎉 Migration Completed!');
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`❌ Failed: ${failed}`);

  } catch (error) {
    console.error('\n💥 Migration Failed:', error.message);
  } finally {
    oldClient.quit();
    newClient.quit();
  }
}

migrateData();
