import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  res.send('staff page');
});

export default router;
