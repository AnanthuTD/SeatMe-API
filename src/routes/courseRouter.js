import express from 'express';
import { models } from '../sequelize/models.js';
import logger from '../helpers/logger.js';

const router = express.Router();

router.post('/course', async (req, res) => {
    const { courses } = req.body || {};

    if (!Array.isArray(courses)) {
        return res.status(400).json({ error: 'Invalid courses data' });
    }

    const failedRecords = [];

    try {
        await Promise.all(
            courses.map(async (course) => {
                try {
                    const [courseInstance] = await models.course.upsert(
                        course,
                        {
                            where: { id: course.id },
                        },
                    );

                    const programId = await models.program.findByPk(
                        course.programId,
                        { attributes: ['id'] },
                    );

                    if (programId) {
                        try {
                            await models.programCourse.upsert({
                                programId: course.programId,
                                courseId: course.id,
                            });
                        } catch (error) {
                            console.error(
                                'Error upserting record in to programCourse:',
                                error,
                            );
                            failedRecords.push({
                                ...course,
                                error: error.message,
                            });
                        }
                    } else {
                        console.error(
                            `Program with ID ${course.programId} not found.`,
                        );

                        failedRecords.push({
                            ...course,
                            error: `Program with ID ${course.programId} not found`,
                        });
                    }
                } catch (error) {
                    console.error('Error upserting record:', error);

                    failedRecords.push({
                        ...course,
                        error: error.message,
                    });
                }
            }),
        );

        return res.status(200).json({ failedRecords });
    } catch (error) {
        console.error('Error in upserting records:', error.message);
        return res.status(500).json({
            error: 'Error upserting values into DB',
            errorMessage: error.message,
        });
    }
});

router.patch('/courseupdate/', async (req, res) => {
    try {
        let courses = [];
        req.body.forEach((item) => {
            let { id } = item;
            let { name } = item;
            let { semester } = item;
            let { type } = item;
            let { program } = item;
            courses.push({
                id,
                name,
                semester,
                type,
                program,
            });
            //  console.log(courses,"hai this is patch");
        });
        const updates = courses.map(async (course1) => {
            // Find the course by courseId
            const course = await models.course.findByPk(course1.id);

            if (!course) {
                return { error: `Course with ID ${course1.id} not found` };
            }

            let updatedData = {
                name: course1.name,
                semester: course1.semester,
                type: course1.type,
                program: course1.program,
            };

            // Update the course with the provided data
            await course.update(updatedData);

            return {
                message: `Course with ID ${course1.id} updated successfully`,
                updatedCourse: course,
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
            message: 'All courses updated successfully',
            results,
        });
    } catch (error) {
        console.error('Error updating course in DB:', error);
        return res.status(500).json({
            error: 'Error updating course in DB',
            errorMessage: error.message,
        });
    }
});
export default router;
