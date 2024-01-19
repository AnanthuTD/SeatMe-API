import path from 'path';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import userRouter from './routes/userRouter.js';
import adminRouter from './routes/adminRoutes/adminRouter.js';
import staffRouter from './routes/staffRouter.js';
import authRouter from './routes/authRouter.js';
import departmentRouter from './routes/departmententRouter.js';
import courseRouter from './routes/courseRouter.js';
import blockRouter from './routes/blockRouter.js';
import datetimeRouter from './routes/datetimeRouter.js';
import programRouter from './routes/programRouter.js';
import roomRouter from './routes/roomRouter.js';
import { sequelize } from './sequelize/connection.js';
import {
    adminAuthMiddleware,
    staffAuthMiddleware,
} from './middlewares/authMiddleware.js';
import { generateCsrfToken } from './middlewares/csrfMiddleware.js';
import getRootDir from '../getRootDir.js';
import validateENV from './env.js';
import { retrieveAndStoreExamsInRedis } from './helpers/adminHelpers/studentSeat.js';
import { isRedisAvailable } from './redis/config.js';
import updateSeatingInfoScheduledTasks from './redis/seatingInfoScheduler.js';
import { loadSeatingAvailabilityTimesToRedis } from './redis/loadSeatingAvailabilityTimes.js';
import loadRefreshTokensToRedis from './redis/loadRefreshTokens.js';
import { updateSeatingInfoRedis } from './redis/seatingInfo.js';
import dayjs from './helpers/dayjs.js';
import logger from './helpers/logger.js';

const dirname = getRootDir();

dotenv.config();

const app = express();

/**
 * Asserts that the database connection is functional.
 * Initializes models after successful connection.
 * @throws {Error} If unable to connect to the database.
 */
async function assertDatabaseConnectionOk({ retryDelay = 5000 }) {
    let retries = 0;

    async function attemptConnection() {
        logger.info(`Checking database connection... Attempt ${retries + 1}`);
        try {
            await sequelize.authenticate();
            logger.info('Database connection OK!');
            // initializing models
            import('./sequelize/models.js');
            return true; // Connection successful
        } catch (error) {
            logger.error(error, 'Unable to connect to the database');
            return false; // Connection failed
        }
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const connectionSuccessful = await attemptConnection();
        if (connectionSuccessful) {
            return; // Exit the function if the connection is successful
        }

        retries += 1;
        logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(); // No implicit return
            }, retryDelay);
        });
    }
}

/**
 * Sets up various middlewares for the application.
 */
function setupMiddlewares() {
    app.use(express.static(path.join(dirname, 'public')));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(compression());
    /* app.use(
        session({
            secret: process.env.SESSION_KEY, // Secret key for session data encryption
            resave: false, // Don't save session data if not modified
            saveUninitialized: true, // Save new sessions even if they have not been modified
        }),
    ); */
    app.use(cookieParser());
    app.set('view engine', 'ejs');
    /* if (process.env.NODE_ENV === 'production') {
        app.use(csrfProtectionMiddleware);
    } */

    app.use((req, res, next) => {
        const startTime = dayjs.tz(); // Use dayjs for the start timestamp

        logger.info(
            `[${startTime.format('YYYY-MM-DD HH:mm:ss')}] Request: ${
                req.method
            } ${req.url}`,
        );

        res.on('finish', () => {
            const endTime = dayjs.tz();
            const duration = endTime.diff(startTime);

            logger.info(
                `[${endTime.format('YYYY-MM-DD HH:mm:ss')}] Response: ${
                    res.statusCode
                } - ${duration}ms`,
            );
        });

        next();
    });
}

/**
 * Sets up routes and attaches middleware for different routes.
 */
function setupRoutes() {
    app.use('/', userRouter);
    app.use('/admin/blockentry', blockRouter);
    app.use('/admin/departmententry', departmentRouter);
    app.use('/admin/courseentry', courseRouter);
    app.use('/admin/roomentry', roomRouter);
    app.use('/admin/programentry', programRouter);
    app.use('/admin', adminAuthMiddleware, adminRouter);
    app.use('/staff', staffAuthMiddleware, staffRouter);
    app.use('/auth', authRouter);
    app.use('/csrf', generateCsrfToken);
    app.use('/admin/departmententry', departmentRouter);
    app.use('/admin/courseentry', courseRouter);
    app.use('/blockentry', blockRouter);
    app.use('/datetime', datetimeRouter);
}

/**
 * Starts the server on the specified port.
 */
function startServer() {
    const port = process.env.PORT;
    app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
    });
}

async function assertRedisConnectionOk() {
    if (!(await isRedisAvailable())) {
        logger.warn('Redis is not available. Retrying in 5 seconds...');
        // Return the result of the recursive call inside the setTimeout callback
        return new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await assertRedisConnectionOk());
            }, 5000);
        });
    }
    return true;
}

function populateRedis() {
    updateSeatingInfoScheduledTasks();
    loadRefreshTokensToRedis();
    loadSeatingAvailabilityTimesToRedis();
    retrieveAndStoreExamsInRedis();
    updateSeatingInfoRedis();
}

/**
 * Initialize the application by connecting to the database, setting up middlewares, routes, and starting the server.
 */
async function init() {
    setupMiddlewares();
    validateENV();
    await assertDatabaseConnectionOk({ retryDelay: 5000 });
    await assertRedisConnectionOk();
    setupRoutes();

    const directoriesToCreate = ['reports', 'pdf'];

    directoriesToCreate.forEach((dirName) => {
        const dirPath = path.join(getRootDir(), dirName);
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    });

    startServer();
    populateRedis();
}

const folderPath = path.join(getRootDir(), 'pdf');
if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

init();

process.on('uncaughtException', (err) => {
    // Log the exception
    logger.fatal(err, 'Uncaught exception detected');

    // Attempt to shut down the server gracefully
    app.close((error) => {
        if (error) {
            logger.error(error, 'Error during server shutdown');
        } else {
            logger.info('Server closed gracefully');
        }

        // If a graceful shutdown is not achieved after 1 second,
        // shut down the process completely
        setTimeout(() => {
            process.abort(); // Exit immediately and generate a core dump file
        }, 1000).unref();
    });
});
