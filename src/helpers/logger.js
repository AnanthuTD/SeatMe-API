import pino from 'pino';
import pretty from 'pino-pretty';
import dotenv from 'dotenv';
import dayjs from './dayjs.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const stream = pretty({
    colorize: true,
});

const logger = pino(
    {
        level: isProduction ? 'info' : 'info',
        timestamp: () =>
            `,"time":"${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}"`,
    },
    isProduction ? null : stream,
);

export default logger;
