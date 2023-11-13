import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
});

// Event handler for error event
redisClient.on('error', (err) => {
    console.error(`Redis Error: ${err}`);
});

// Check if the Redis client is ready after initialization
redisClient.on('ready', () => {
    console.log('Connected to Redis server');
});

// Check if the Redis client encountered a connection issue during initialization
if (
    redisClient.status === 'connecting' ||
    redisClient.status === 'reconnecting'
) {
    console.error('Failed to connect to Redis server during initialization');
    // Handle the failure appropriately, such as exiting the application or taking corrective actions
}

export default redisClient;
