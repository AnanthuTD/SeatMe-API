import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import userRouter from './routes/user.js';

dotenv.config({ path: 'env/.env' });

const filenameUrl = import.meta.url;
const dirname = path.dirname(fileURLToPath(filenameUrl));

const app = express();

app.use(express.static(path.join(dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/', userRouter);

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
app.get('/', (req, res) => {
  res.render('index', { message: 'Welcome to My Express App' });
});

app.post('/submit', (req, res) => {
  const data = req.body;
  res.render('result', { data });
});

// Start the server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
