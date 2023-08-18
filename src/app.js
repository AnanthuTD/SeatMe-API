import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import userRouter from './routes/userRouter.js';
import adminRouter from './routes/adminRouter.js';
import staffRouter from './routes/staffRouter.js';
import loginRouter from './routes/loginRouter.js';
import { sequelize } from './sequelize/connection.js';
import {
  authAdminMiddleware,
  authStaffMiddleware,
} from './middlewares/auth.js';

const filenameUrl = import.meta.url;
const dirname = path.dirname(fileURLToPath(filenameUrl));

dotenv.config();

const app = express();

async function assertDatabaseConnectionOk() {
  console.log(`Checking database connection...`);
  try {
    await sequelize.authenticate();
    console.log('Database connection OK!');
    // initializing models
    import('./sequelize/models.js');
  } catch (error) {
    console.log('Unable to connect to the database:');
    console.log(error.message);
    throw new Error(
      'Unable to connect to the database. Check your database configuration.',
    );
  }
}

function setupMiddlewares() {
  app.use(express.static(path.join(dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.set('view engine', 'ejs');

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

function setupRoutes() {
  app.use('/', userRouter);
  app.use('/admin', authAdminMiddleware, adminRouter);
  app.use('/staff', authStaffMiddleware, staffRouter);
  app.use('/login', loginRouter);
}

function startServer() {
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

async function init() {
  await assertDatabaseConnectionOk();
  setupMiddlewares();
  setupRoutes();
  startServer();
}

init();
