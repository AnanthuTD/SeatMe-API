import express from 'express';
import { createStaff } from '../../helpers/bcryptHelper.js';
import {
    getStaffCount,
    getStaffs,
} from '../../helpers/adminHelpers/adminHelper.js';
import { getStaffsByDepartmentId } from '../../helpers/adminHelpers/staffHelper.js';

const router = express.Router();

/**
 * @route POST /admin/create-staff
 * @desc Create a new staff member.
 * @param {object} req.body.staffData - The user data for the new staff member.
 * @returns {object} Response object with status and message indicating the result of the operation.
 */
router.post('/', async (req, res) => {
    try {
        const { staffs } = req.body;
        const result = await createStaff(staffs);
        res.status(result.status).json(result);
    } catch (error) {
        console.error(`Error in POST /staff: ${error.message}`);
        res.status(500).json({ error: 'Error creating staff members' });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await getStaffCount();
        res.json(count);
    } catch (error) {
        console.error(`Error in GET /staff/count: ${error.message}`);
        res.status(500).json({ error: 'Error counting staff members' });
    }
});

router.get('/list', async (req, res) => {
    try {
        let { query, column, offset, limit, sortField, sortOrder } = req.query;

        const allowedColumns = [
            'id',
            'name',
            'email',
            'phone',
            'departmentId',
            'departmentName',
            'designation',
        ];

        // Validate and adjust the 'column' parameter
        if (
            !Array.isArray(column) ||
            !column.every((col) => allowedColumns.includes(col))
        ) {
            column = ['id'];
        }

        query = query || [''];
        sortField = sortField || 'updatedAt';
        sortOrder = sortOrder || 'DESC';
        offset = parseInt(offset, 10) || 0;
        limit = parseInt(limit, 10) || 10;

        const data = await getStaffs(
            query,
            column,
            offset,
            limit,
            sortField,
            sortOrder,
        );

        res.json(data);
    } catch (error) {
        console.error(`Error in GET /staff/list: ${error.message}`);
        res.status(500).json({ error: 'Error fetching staff list' });
    }
});

/**
 * GET staff members by department ID.
 */
router.get('/:departmentId', async (req, res) => {
    try {
        const { departmentId } = req.params;

        if (!departmentId) res.sendStatus(400);

        const result = await getStaffsByDepartmentId({ departmentId });

        res.json(result);
    } catch (error) {
        console.error('Error on GET /:departmentId', error);

        res.status(500).json({ error: true, message: 'An error occurred.' });
    }
});

export default router;
