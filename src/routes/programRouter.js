import express from 'express';
import { models } from '../sequelize/models.js';
import logger from '../helpers/logger.js';

const router = express.Router();

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
        console.error('Error in processing programs:', error);
        res.status(500).send('Error processing programs');
    }
});

router.patch('/programupdate/', async (req, res) => {
    try {
        let programs = [];
        req.body.forEach((item) => {
            let id = item.id;
            let name = item.name;
            let duration = item.duration;
            let level = item.level;
            let departmentId = item.departmentId;
            let abbreviation = item.abbreviation;
            programs.push({
                id,
                name,
                duration,
                level,
                departmentId,
                abbreviation,
            });
            //  console.log(programs,"hai this is patch");
        });
        programs.forEach((program) => {
            const programId = program.id;
            const programName = program.name;
            const programduration = program.duration;
            const programlevel = program.level;
            const programdept = program.departmentId;
            const proabbreviation = program.abbreviation;

            // Use the values as needed
            console.log('program ID:', programId);
            console.log('program Name:', programName);
            console.log('program duration:', programduration);
            console.log('program level:', programlevel);
            console.log('program dept:', programdept);
            console.log('program abbreviation:',proabbreviation)
            console.log('----------------------');
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
        res.status(200).json({
            message: 'All programs updated successfully',
            results,
        });
    } catch (error) {
        console.error('Error updating program in DB:', error);
        res.status(500).json({
            error: 'Error updating program in DB',
            errorMessage: error.message,
        });
    }
});

export default router;
