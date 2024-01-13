import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    connectTimeout: 2000,
});

redisClient.on('connecting', () => {
    console.log('Connecting to Redis server...');
});

redisClient.on('reconnecting', () => {
    console.log('Reconnecting to Redis server...');
});

redisClient.on('ready', async () => {
    try {
        // await redisClient.flushall(); // TODO don't remove all from redis
        console.log('Redis cleared successfully');
    } catch (error) {
        console.error('Clearing Redis failed:', error);
    } finally {
        console.log('Connected to Redis server');
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Error:', err);
});

async function isRedisAvailable() {
    try {
        await redisClient.ping();
        return true;
    } catch (error) {
        return false;
    }
}

export { isRedisAvailable };

export default redisClient;
