import express from 'express';
import jwt from 'jsonwebtoken';
import { checkCredentialsAndRetrieveData } from '../utils/admin.js';
import { authAdminMiddleware } from '../middlewares/auth.js';

const secretKey = process.env.SECRET_KEY;

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(400).send('Both email and password are required.');
  }

  try {
    const userData = await checkCredentialsAndRetrieveData(email, password);

    if (userData) {
      const token = jwt.sign({ admin: userData }, secretKey, {
        expiresIn: '1h', // Token expires in 1 hour
      });

      const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        expires: expirationDate,
        sameSite: 'strict',
      });

      return res.send(token);
    }
    return res.status(401).send('Invalid credentials or not an admin.');
  } catch (error) {
    return res.status(500).send('An error occurred during authentication.');
  }
});

// middleware to authenticate admin
router.use(authAdminMiddleware);

router.get('/', (req, res) => {
  res.send('admin page');
});

export default router;
