import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import userRouter from './routes/user.js';
import adminRouter from './routes/admin.js';
import { sequelize } from './sequelize/db.js';

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
  app.set('view engine', 'ejs');

  app.use((err, req, res) => {
    console.error(err);
    res.status(500).send('An error occurred');
  });

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
  app.use('/admin', adminRouter);
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
