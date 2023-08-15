import express from 'express';
import { authAdminMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authAdminMiddleware, (req, res) => {
  res.send('admin page');
});

export default router;
