import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cron from 'node-cron';
import userRouter from './routes/userRouter.js';
import adminRouter from './routes/adminRouter.js';
import staffRouter from './routes/staffRouter.js';
import loginRouter from './routes/loginRouter.js';
import departmentRouter from './routes/departmententRouter.js';
import courseRouter from './routes/courseRouter.js';
import blockRouter from './routes/blockRouter.js';
import datetimeRouter from './routes/datetimeRouter.js';
import programRouter from './routes/programRouter.js';
import { sequelize } from './sequelize/connection.js';
import { cleanBlacklist } from './helpers/jwtHelper.js';
import {
    authAdminMiddleware,
    authStaffMiddleware,
} from './middlewares/authMiddleware.js';
import {
    csrfProtectionMiddleware,
    generateCsrfToken,
} from './middlewares/csrfMiddleware.js';
import getRootDir from '../getRootDir.js';

const dirname = getRootDir();

dotenv.config();

const app = express();

/**
 * Asserts that the database connection is functional.
 * Initializes models after successful connection.
 * @throws {Error} If unable to connect to the database.
 */
async function assertDatabaseConnectionOk() {
    console.log(`Checking database connection...`);
    try {
        await sequelize.authenticate();
        console.log('Database connection OK!');
        // initializing models
        import('./sequelize/models.js');
    } catch (error) {
        console.error('Unable to connect to the database:');
        console.error(error.message);
        throw new Error(
            'Unable to connect to the database. Check your database configuration.',
        );
    }
}

/**
 * Sets up various middlewares for the application.
 */
function setupMiddlewares() {
    app.use(express.static(path.join(dirname, 'public')));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(
        session({
            secret: process.env.SESSION_KEY, // Secret key for session data encryption
            resave: false, // Don't save session data if not modified
            saveUninitialized: true, // Save new sessions even if they have not been modified
        }),
    );
    app.use(cookieParser());
    app.set('view engine', 'ejs');
    if (process.env.NODE_ENV === 'production') {
        app.use(csrfProtectionMiddleware);
    }

    app.use((req, res, next) => {
        const start = Date.now();
        console.log(
            `[${new Date().toISOString()}] Request: ${req.method} ${req.url}`,
        );
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(
                `[${new Date().toISOString()}] Response: ${
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
    app.use('/admin/departmententry', departmentRouter);
    app.use('/admin/courseentry', courseRouter);
    app.use('/admin/programentry', programRouter);
    app.use('/admin', /* authAdminMiddleware, */ adminRouter);
    app.use('/staff', /* authStaffMiddleware, */ staffRouter);
    app.use('/login', loginRouter);
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
        console.log(`Server is running on port ${port}`);
    });
}

/**
 * Initialize the application by connecting to the database, setting up middlewares, routes, and starting the server.
 */
async function init() {
    await assertDatabaseConnectionOk();
    setupMiddlewares();
    setupRoutes();
    startServer();

    // Schedule the jwt blacklist cleanup task to run every day at midnight (adjust as needed)
    cron.schedule('0 0 * * *', () => {
        cleanBlacklist();
    });
}

// Initialize the application
init();
