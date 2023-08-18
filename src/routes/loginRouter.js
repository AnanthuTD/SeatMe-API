import express from 'express';
import jwt from 'jsonwebtoken';
import { checkCredentialsAndRetrieveData } from '../utils/common.js';

const router = express.Router();

const secretKey = process.env.SECRET_KEY;

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(400).send('Both email and password are required.');
  }

  try {
    const userData = await checkCredentialsAndRetrieveData(email, password);
    let token;
    if (userData) {
      if (userData.is_admin)
        token = jwt.sign(userData, secretKey, {
          expiresIn: '1h', // Token expires in 1 hour
        });
      else
        token = jwt.sign(userData, secretKey, {
          expiresIn: '1h', // Token expires in 1 hour
        });

      console.log(jwt.verify(token, secretKey));

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

export default router;
