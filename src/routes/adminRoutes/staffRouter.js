import express from 'express';
import { createStaff, updatePassword } from '../../helpers/bcryptHelper.js';
import {
    getStaffCount,
    getStaffs,
} from '../../helpers/adminHelpers/adminHelper.js';
import { getStaffsByDepartmentCode } from '../../helpers/adminHelpers/staffHelper.js';
import { models } from '../../sequelize/models.js';
import generateTeacherDetailsPDF from '../../helpers/adminHelpers/staffAssignmentPDF.js';
import logger from '../../helpers/logger.js';
import { authorizeAdmin } from '../../helpers/commonHelper.js';

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
        logger.error(`Error in POST /staff: ${error.message}`);
        res.status(500).json({ error: 'Error creating staff members' });
    }
});

router.patch('/update-password', async (req, res) => {
    try {
        const { staffId, newPassword } = req.body;

        const result = await updatePassword(staffId, newPassword);

        return res.status(result.status).json({ message: result.message });
    } catch (error) {
        logger.error(error, 'Error:');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.patch('/:staffId', async (req, res) => {
    try {
        const staff = req.body;
        const { id, name, email, phone, departmentId } = staff;

        if (!name || !email) {
            return res
                .status(400)
                .json({ error: 'Invalid input. All fields are required.' });
        }

        const [updateCount] = await models.authUser.update(
            { name, email, phone, departmentId },
            {
                where: { id },
            },
        );

        if (updateCount > 0) {
            return res.sendStatus(200);
        }

        return res.status(404).json({ error: 'Staff not found' });
    } catch (error) {
        logger.error(`Error in PATCH /staff: ${error.message}`);
        return res.status(500).json({ error: 'Error updating staff' });
    }
});

router.delete('/:staffId', authorizeAdmin(), async (req, res) => {
    try {
        const { staffId } = req.params;

        // Delete the staff member from the database
        const deletedCount = await models.authUser.destroy({
            where: { id: staffId },
        });

        if (deletedCount > 0) {
            return res.sendStatus(200);
        }

        return res.status(404).json({ error: 'Staff not found' });
    } catch (error) {
        logger.error(`Error in DELETE /staff/:staffId: ${error.message}`);
        return res.status(500).json({ error: 'Error deleting staff' });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await getStaffCount();
        res.json(count);
    } catch (error) {
        logger.error(`Error in GET /staff/count: ${error.message}`);
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
        logger.error(`Error in GET /staff/list: ${error.message}`);
        res.status(500).json({ error: 'Error fetching staff list' });
    }
});

/**
 * GET staff members by department ID.
 */
router.get('/:departmentCode', async (req, res) => {
    try {
        const { departmentCode } = req.params;

        if (!departmentCode) res.sendStatus(400);

        const result = await getStaffsByDepartmentCode({ departmentCode });

        res.json(result);
    } catch (error) {
        logger.error(error, 'Error on GET /:departmentCode');

        res.status(500).json({ error: true, message: 'An error occurred.' });
    }
});

router.post('/assign', async (req, res) => {
    try {
        const { dateTimeId, ...assignments } = req.body;
        const roomIds = Object.keys(assignments);
        const failedAssignments = [];

        // Use Promise.all to process all assignments concurrently
        await Promise.all(
            roomIds.map(async (roomId) => {
                const authUserId = assignments[roomId];

                try {
                    // Try to find an existing assignment
                    const existingAssignment = await models.teacherSeat.findOne(
                        {
                            where: { roomId, dateTimeId },
                        },
                    );

                    if (existingAssignment) {
                        // If an assignment already exists, update it
                        await existingAssignment.update({ authUserId });
                    } else {
                        const insertData = {
                            roomId,
                            authUserId,
                            dateTimeId,
                        };

                        // If no assignment exists, create a new one
                        await models.teacherSeat.create(insertData);
                    }
                } catch (error) {
                    logger.error(error);
                    failedAssignments.push({ roomId, authUserId });
                }
            }),
        );

        const fileName = await generateTeacherDetailsPDF(dateTimeId);

        if (failedAssignments.length > 0) {
            res.status(200).json({
                error: 'Some assignments failed to update or create',
                failedAssignments,
                fileName,
            });
        } else {
            res.status(200).json({
                message: 'Teachers assigned successfully',
                fileName,
            });
        }
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Failed to assign teachers' });
    }
});

export default router;
