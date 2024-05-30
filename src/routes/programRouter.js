import express from 'express';
import { models } from '../sequelize/models.js';
import logger from '../helpers/logger.js';
import { authorizeAdmin } from '../helpers/commonHelper.js';

const router = express.Router();

router.delete('/program/:programId', authorizeAdmin(), async (req, res) => {
    const deleteProgram = async (programId) => {
        try {
            // Find the program by programId
            const program = await models.program.findByPk(programId);

            if (!program) {
                throw new Error(`Program with ID ${programId} not found`);
            }

            // Delete the program
            const deletedProgramCount = await program.destroy();

            if (deletedProgramCount > 0) {
                return {
                    message: `Program with ID ${programId} deleted successfully`,
                };
            }

            throw new Error(`Failed to delete program with ID ${programId}`);
        } catch (error) {
            console.error('Error deleting program:', error.message);
            throw Error(error.message);
        }
    };

    const { programId } = req.params;

    try {
        const result = await deleteProgram(programId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
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
router.patch('/programupdate/', async (req, res) => {
    try {
        let programs = [];
        req.body.forEach((item) => {
            let { id } = item;
            let { name } = item;
            let { duration } = item;
            let { level } = item;
            let { departmentId } = item;
            let { abbreviation } = item;
            programs.push({
                id,
                name,
                duration,
                level,
                departmentId,
                abbreviation,
            });
            //  logger.trace(programs,"hai this is patch");
        });
        programs.forEach((program) => {
            const programId = program.id;
            const programName = program.name;
            const programduration = program.duration;
            const programlevel = program.level;
            const programdept = program.departmentId;
            const proabbreviation = program.abbreviation;

            // Use the values as needed
            logger.trace('program ID:', programId);
            logger.trace('program Name:', programName);
            logger.trace('program duration:', programduration);
            logger.trace('program level:', programlevel);
            logger.trace('program dept:', programdept);
            logger.trace('program abbreviation:', proabbreviation);
            logger.trace('----------------------');
        });
        const updates = programs.map(async (program1) => {
            // Find the program by programId
            const program = await models.program.findByPk(program1.id);

            if (!program) {
                return { error: `program with ID ${program1.id} not found` };
            }

            let updatedData = {
                name: program1.name,
                duration: program1.duration,
                level: program1.level,
                departmentId: program1.departmentId,
                abbreviation: program1.abbreviation,
            };

            // Update the program with the provided data
            await program.update(updatedData);

            return {
                message: `program with ID ${program1.id} updated successfully`,
                updatedprogram: program,
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
        return res.status(200).json({
            message: 'All programs updated successfully',
            results,
        });
    } catch (error) {
        logger.error(error, 'Error updating program in DB:');
        return res.status(500).json({
            error: 'Error updating program in DB',
            errorMessage: error.message,
        });
    }
});

export default router;
