import express from 'express';
import { models } from '../sequelize/models.js';
import logger from '../helpers/logger.js';
import { authorizeAdmin } from '../helpers/commonHelper.js';

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
                            logger.error(
                                'Error upserting record in to programCourse:',
                                error,
                            );
                            failedRecords.push({
                                ...course,
                                error: error.message,
                            });
                        }
                    } else {
                        logger.error(
                            `Program with ID ${course.programId} not found.`,
                        );

                        failedRecords.push({
                            ...course,
                            error: `Program with ID ${course.programId} not found`,
                        });
                    }
                } catch (error) {
                    logger.error(error, 'Error upserting record:');

                    failedRecords.push({
                        ...course,
                        error: error.message,
                    });
                }
            }),
        );

        return res.status(200).json({ failedRecords });
    } catch (error) {
        logger.error(error, 'Error in upserting records:');
        return res.status(500).json({
            error: 'Error upserting values into DB',
            errorMessage: error.message,
        });
    }
});
// Import the deleteCourse function
// import { deleteCourse } from './yourModuleFileName.js';

// Use the deleteCourse function in your route or other logic
router.delete('/course/:courseId', authorizeAdmin(), async (req, res) => {
    const deleteCourse = async (courseId) => {
        try {
            // Find the course by courseId
            const course = await models.course.findByPk(courseId);
            console.error(course);
            if (!course) {
                throw new Error(`Course with ID ${courseId} not found`);
            }

            // Delete the course
            const deletedCourseCount = await course.destroy();
            console.error('check', deletedCourseCount.dataValues.id);
            console.error('deleted course', deletedCourseCount);
            if (deletedCourseCount.dataValues.id) {
                console.error('succes');
                return {
                    message: `Course with ID ${deletedCourseCount.dataValues.id} deleted successfully`,
                };
            }
            throw new Error(`Failed to delete course with ID ${courseId}`);
        } catch (error) {
            console.error('Error deleting course:', error.message);
            // throw Error(error.message);
        }
    };
    const { courseId } = req.params;
    try {
        const result = deleteCourse(courseId);
        console.error('rsult : ', result);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
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
        logger.error(error, 'Error updating course in DB');
        return res.status(500).json({
            error: 'Error updating course in DB',
            errorMessage: error.message,
        });
    }
});
const updateCourse = async (course) => {
    const [updateCount] = await models.course.update(course, {
        where: { id: course.id },
    });

    return updateCount;
};

const deleteCourse = async (courseId) => {
    try {
        const deletedCourse = await models.course.destroy({
            where: {
                id: courseId,
            },
        });

        return deletedCourse;
    } catch (error) {
        throw Error(error.message);
    }
};
export default router;
