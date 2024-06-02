import express from 'express';
import { models } from '../../sequelize/models.js';
import logger from '../../helpers/logger.js';
import { authorizeAdmin } from '../../helpers/commonHelper.js';

const router = express.Router();

router.delete('/program/:programId', authorizeAdmin(), async (req, res) => {
    console.log('--------------------------delete called');
    const { programId } = req.params;

    try {
        // Find the program by programId
        const program = await models.program.findByPk(programId);

        if (!program) {
            return res
                .status(404)
                .json({ message: `Program with ID ${programId} not found` });
        }

        // Delete the program
        await program.destroy();

        // Send a success response
        return res.status(200).json({
            message: `Program with ID ${programId} deleted successfully`,
        });
    } catch (error) {
        console.error('Error deleting program:', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/program', async (req, res) => {
    const { programs } = req.body || {};

    const failedRecords = [];

    try {
        await Promise.all(
            programs.map(async (program) => {
                try {
                    await models.program.upsert(program, {
                        validate: true,
                    });
                } catch (error) {
                    failedRecords.push({
                        ...program,
                        error: error.message,
                    });
                }
            }),
        );

        res.status(200).json({ failedRecords });
    } catch (error) {
        logger.error(error, 'Error in processing programs:');
        res.status(500).send('Error processing programs');
    }
});

router.patch('/programupdate', async (req, res) => {
    try {
        console.log('-------------------------------------Called update');
        // Iterate through each updated program sent in the request body
        const updates = req.body.map(async (item) => {
            // Find the program by its ID
            let program = await models.program.findByPk(item.id);
            console.log(
                `-------------------------program:${program}, itemID:${item.id}`,
            );
            if (!program) {
                // If program not found, try finding it again
                program = await models.program.findOne({
                    where: { id: item.id },
                });
            }
            if (!program) {
                console.log('-------------------------error');
                // If program still not found, return an error message
                return { error: `program with ID ${item.id} not found` };
            }
            // Update the program with the new details
            console.log(
                `---------------------------item${item.departmentCode}`,
            );
            await program.update({
                name: item.name,
                duration: item.duration,
                level: item.level,
                isAided: item.isAided,
                abbreviation: item.abbreviation,
                departmentCode: item.departmentCode,
                // Add any additional fields you want to update here
            });
            // Return a success message and the updated program
            return {
                message: `program with ID ${item.id} updated successfully`,
                updatedprogram: program,
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
        // If no errors, return a success message with the updated programs
        res.status(200).json({
            message: 'All programs updated successfully',
            results,
        });
    } catch (error) {
        // If an error occurs, log it and return a 500 status with an error message
        logger.error(error, 'Error updating program in DB:');
        res.status(500).json({
            error: 'Error updating program in DB',
            errorMessage: error.message,
        });
    }
});

export default router;
