import express from 'express';
import getRootDir from '../../getRootDir.js';
import { models } from '../sequelize/models.js';
import logger from '../helpers/logger.js';

const router = express.Router();

// Define a route to serve a HTML page
router.get('/', (req, res) => {
    let p = `${getRootDir()}/src/Views/department.html`;
    res.sendFile(p);
});

// Route for deleting a department by ID
router.delete('/department/:departmentId', async (req, res) => {
    const { departmentId } = req.params;
    try {
        const deletedDepartment = await models.department.destroy({
            where: { id: departmentId },
        });
        if (deletedDepartment > 0) {
            return res.status(200).json({
                message: `Department with ID ${departmentId} deleted successfully`,
            });
        }
        return res
            .status(404)
            .json({ error: `Department with ID ${departmentId} not found` });
    } catch (error) {
        console.error('Error deleting department:', error);
        return res.status(500).json({
            error: 'Error deleting department',
            errorMessage: error.message,
        });
    }
});

// Route for adding new departments
router.post('/department', (req, res) => {
    let body = req.body.departments;
    let deps = body.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
    }));
    models.department
        .bulkCreate(deps, { validate: true, ignoreDuplicates: true })
        .then(() => res.send())
        .catch((error) => {
            logger.error(error, 'Error in inserting into DB:');
            res.status(500).json({
                error: 'Error inserting values into DB',
                sqlError: error.message,
            });
        });
});

// Route for updating department details
router.patch('/departmentupdate', async (req, res) => {
    try {
        console.log('-------------------------------------Called update');
        // Iterate through each updated department sent in the request body
        const updates = req.body.map(async (item) => {
            // Find the department by its ID
            let department = await models.department.findByPk(item.id);
            console.log(
                `-------------------------department:${department}, itemID:${item.id}`,
            );
            if (!department) {
                // If department not found, try finding it again
                department = await models.department.findOne({
                    where: { id: item.id },
                });
            }
            if (!department) {
                console.log('-------------------------error');
                // If department still not found, return an error message
                return { error: `Department with ID ${item.id} not found` };
            }
            // Update the department with the new details
            await department.update({
                name: item.name,
                // Add any additional fields you want to update here
            });
            // Return a success message and the updated department
            return {
                message: `Department with ID ${item.id} updated successfully`,
                updatedDepartment: department,
            };
        });

        // Wait for all updates to complete
        const results = await Promise.all(updates);
        // Filter out any errors from the results
        const errors = results.filter((result) => result.error);
        // If there are errors, return a 404 status with the error messages
        if (errors.length > 0) {
            return res.status(404).json({ errors });
        }
        // If no errors, return a success message with the updated departments
        res.status(200).json({
            message: 'All departments updated successfully',
            results,
        });
    } catch (error) {
        // If an error occurs, log it and return a 500 status with an error message
        logger.error(error, 'Error updating department in DB:');
        res.status(500).json({
            error: 'Error updating department in DB',
            errorMessage: error.message,
        });
    }
});

export default router;
