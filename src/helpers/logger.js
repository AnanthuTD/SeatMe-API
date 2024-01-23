import pino from 'pino';
import dotenv from 'dotenv';
import dayjs from './dayjs.js';

dotenv.config();

// Determine the environment
const isProduction = process.env.NODE_ENV === 'production';

// eslint-disable-next-line import/no-mutable-exports
let logger;

// Configure logger for production environment
if (isProduction) {
    logger = pino({
        level: 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: () =>
            `,"time":"${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}"`,
    });
} else {
    // Configure logger for development environment with dynamic import for prettifying logs
    try {
        const pretty = await import('pino-pretty');
        const stream = pretty.default({ colorize: true });
        logger = pino(
            {
                level: 'debug', // Adjust log level for development if needed (e.g., 'debug')
                timestamp: () =>
                    `,"time":"${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}"`,
            },
            stream,
        );
    } catch (error) {
        // Handle errors during dynamic import of pino-pretty
        console.error('Error importing pino-pretty:', error);
        logger = pino({
            level: 'info', // Fallback to a basic configuration without prettifying
            formatters: {
                level: (label) => {
                    return { level: label.toUpperCase() };
                },
            },
            timestamp: () =>
                `,"time":"${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}"`,
        });
    }
}

export default logger;
