import express from 'express';
import { createStaff } from '../helpers/bcryptHelper.js';
import {
    getStaffCount,
    getStaffs,
    getStudentCount,
    findStudent,
} from '../helpers/adminHelpers/adminHelper.js';

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

router.get('/staff/count', async (req, res) => {
    const count = await getStaffCount();
    res.json(count);
});

router.get('/staff/list', async (req, res) => {
    const { start, pageSize } = req.query;
    const offset = parseInt(start, 10) || 0;
    const limit = parseInt(pageSize, 10) || 10;

    const data = await getStaffs(offset, limit);

    res.json(data);
});

router.get('/student/count', async (req, res) => {
    const count = await getStudentCount();
    res.json(count);
});

router.get('/student/list', async (req, res) => {
    let { query = '', column = 'id', start, results } = req.query;
    const allowedColumns = [
        'id',
        'name',
        'rollNumber',
        'semester',
        'program.name',
        'programId',
    ];

    if (!allowedColumns.includes(column)) {
        // If not, set it to a default value (e.g., 'id')
        column = 'id';
    }
    const offset = parseInt(start, 10) || 0;
    const limit = parseInt(results, 10) || 10;

    const data = await findStudent(query, column, offset, limit);

    res.json(data);
});

export default router;
