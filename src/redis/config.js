import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
});

redisClient.on('error', (err) => {
    console.error(`Redis Error: ${err}`);
});

export default redisClient;
