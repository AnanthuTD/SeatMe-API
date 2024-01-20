import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import logger from '../helpers/logger.js';

dotenv.config();

const redisClient = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    connectTimeout: 2000,
});

redisClient.on('connecting', () => {
    logger.trace('Connecting to Redis server...');
});

redisClient.on('reconnecting', () => {
    logger.trace('Reconnecting to Redis server...');
});

redisClient.on('ready', async () => {
    try {
        // await redisClient.flushall(); // TODO don't remove all from redis
        logger.trace('Redis cleared successfully');
    } catch (error) {
        logger.error('Clearing Redis failed:', error);
    } finally {
        logger.trace('Connected to Redis server');
    }
});

redisClient.on('error', (err) => {
    logger.error('Redis Error:', err);
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
