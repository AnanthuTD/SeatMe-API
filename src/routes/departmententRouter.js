import express from 'express';
import getRootDir from '../../getRootDir.js';

import { models } from '../sequelize/models.js';
import logger from '../helpers/logger.js';

const router = express.Router();

router.get('/', (req, res) => {
    let p = `${getRootDir()}/src/Views/department.html`;

    // res.sendFile(p);
});

// Add a new route for handling department deletion
router.delete('/department/:departmentId', async (req, res) => {
    const { departmentId } = req.params;

    try {
        const deletedDepartment = await models.department.destroy({
            where: {
                id: departmentId,
            },
        });

        if (deletedDepartment > 0) {
            return res.status(200).json({
                message: `Department with ID ${departmentId} deleted successfully`,
            });
        }

        return res.status(404).json({
            error: `Department with ID ${departmentId} not found`,
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        return res.status(500).json({
            error: 'Error deleting department',
            errorMessage: error.message,
        });
    }
});

router.post('/department', (req, res) => {
    let body = req.body.departments;
    let deps = [];
    body.forEach((item) => {
        let { id } = item;
        let { name } = item;
        let { code } = item;
        deps.push({
            id,
            name,
            code,
        });
    });

    models.department
        .bulkCreate(deps, { validate: true, ignoreDuplicates: true })
        .then(() => {
            res.send();
        })
        .catch((error) => {
            logger.error(error, 'Error in inserting into DB:');

            // Sending SQL error message to frontend
            res.status(500).json({
                error: 'Error inserting values into DB',
                sqlError: error.message,
            });
        });
});

router.patch('/departmentupdate/', async (req, res) => {
    try {
        let departments = [];
        req.body.forEach((item) => {
            let { id } = item;
            let { name } = item;
            departments.push({
                id,
                name,
            });
            //  logger.trace(departments,"hai this is patch");
        });
        const updates = departments.map(async (department1) => {
            // Find the department by departmentId
            const department = await models.department.findByPk(department1.id);

            if (!department) {
                return {
                    error: `department with ID ${department1.id} not found`,
                };
            }

            let updatedData = {
                name: department1.name,
            };

            // Update the department with the provided data
            await department.update(updatedData);

            return {
                message: `department with ID ${department1.id} updated successfully`,
                updateddepartment: department,
            };
        });

        // Wait for all updates to complete before sending the response
        const results = await Promise.all(updates);

        // Check for errors in the results
        const errors = results.filter((result) => result.error);
        if (errors.length > 0) {
            return res.status(404).json({ errors });
        }

        // If no errors, send a success response
        res.status(200).json({
            message: 'All departments updated successfully',
            results,
        });
    } catch (error) {
        logger.error(error, 'Error updating department in DB:');
        res.status(500).json({
            error: 'Error updating department in DB',
            errorMessage: error.message,
        });
    }
});

export default router;
