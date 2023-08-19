import express from 'express';
import { createStaff } from '../utils/bcryptUtils.js';

const router = express.Router();

/**
 * @route GET /admin
 * @desc Display the admin page.
 */
router.get('/', (req, res) => {
  res.send('admin page');
});

/**
 * @route POST /admin/create-staff
 * @desc Create a new staff member.
 * @param {object} req.body.staffData - The user data for the new staff member.
 * @returns {object} Response object with status and message indicating the result of the operation.
 */
router.post('/create-staff', async (req, res) => {
  const { staffData } = req.body;

  const result = await createStaff(staffData);

  return res.status(result.status).json(result);
});

export default router;
