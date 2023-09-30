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
    let { query, column, offset, limit, sortField, sortOrder } = req.query;

    const allowedColumns = [
        'id',
        'name',
        'rollNumber',
        'semester',
        'program.name',
        'programId',
    ];

    if (!allowedColumns.includes(column)) {
        column = 'id';
    }

    query = query || '';
    sortField = sortField || 'updatedAt';
    sortOrder = sortOrder || 'DESC';
    offset = parseInt(offset, 10) || 0;
    limit = parseInt(limit, 10) || 10;

    console.log('sort order: ', sortOrder);

    const data = await getStaffs(
        query,
        column,
        offset,
        limit,
        sortField,
        sortOrder,
    );

    res.json(data);
});

router.get('/student/count', async (req, res) => {
    const count = await getStudentCount();
    res.json(count);
});

router.get('/student/list', async (req, res) => {
    let { query, column, offset, limit, sortField, sortOrder } = req.query;

    const allowedColumns = [
        'id',
        'name',
        'rollNumber',
        'semester',
        'program.name',
        'programId',
    ];

    if (!allowedColumns.includes(column)) {
        column = 'id';
    }

    query = query || '';
    sortField = sortField || 'updatedAt';
    sortOrder = sortOrder || 'DESC';
    offset = parseInt(offset, 10) || 0;
    limit = parseInt(limit, 10) || 10;

    console.log('sort order: ', sortOrder);

    const data = await findStudent(
        query,
        column,
        offset,
        limit,
        sortField,
        sortOrder,
    );

    res.json(data);
});

export default router;
