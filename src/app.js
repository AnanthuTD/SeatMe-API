import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import userRouter from './routes/user.js';
import adminRouter from './routes/admin.js';

dotenv.config({ path: 'env/.env' });

const filenameUrl = import.meta.url;
const dirname = path.dirname(fileURLToPath(filenameUrl));

const app = express();

app.use(express.static(path.join(dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Error handling
app.use((err, req, res) => {
  console.error(err);
  res.status(500).send('An error occurred');
});

// Logging
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);

// Start the server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
