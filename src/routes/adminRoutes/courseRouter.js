import express from 'express';
import { models, sequelize } from '../../sequelize/models.js';
import logger from '../../helpers/logger.js';

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

                    const courseId = await models.course.findByPk(
                        course.courseId,
                        { attributes: ['id'] },
                    );

                    if (courseId) {
                        try {
                            await models.courseCourse.upsert({
                                courseId: course.courseId,
                                // courseId: course.id,
                            });
                        } catch (error) {
                            logger.error(
                                'Error upserting record in to courseCourse:',
                                error,
                            );
                            failedRecords.push({
                                ...course,
                                error: error.message,
                            });
                        }
                    } else {
                        logger.error(
                            `course with ID ${course.courseId} not found.`,
                        );

                        failedRecords.push({
                            ...course,
                            error: `course with ID ${course.courseId} not found`,
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
router.delete('/course/:courseId', async (req, res) => {
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
    // AGFX403 B.G DESIGN FOR CEL ANIMATION (AOC) skill 4
    try {
        const result = deleteCourse(courseId);
        console.error('rsult : ', result);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.patch('/courseupdate', async (req, res) => {
    try {
        console.log('-------------------------------------Called update');
        // Iterate through each updated course sent in the request body
        const updates = req.body.map(async (item) => {
            // Find the course by its ID
            let course = await models.course.findByPk(item.id);
            console.log(
                `-------------------------course:${course}, itemID:${item}`,
            );
            if (!course) {
                // If course not found, try finding it again
                course = await models.course.findOne({
                    where: { id: item.id },
                });
            }
            if (!course) {
                console.log('-------------------------error');
                // If course still not found, return an error message
                return { error: `course with ID ${item.id} not found` };
            }
            // Update the course with the new details
            console.log(`---------------------------item${course}`);
            await course.update({
                name: item.name,
                semester: item.semester,
                // Add any additional fields you want to update here
            });
            // Return a success message and the updated course
            return {
                message: `course with ID ${item.id} updated successfully`,
                updatedcourse: course,
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
        // If no errors, return a success message with the updated courses
        res.status(200).json({
            message: 'All courses updated successfully',
            results,
        });
    } catch (error) {
        // If an error occurs, log it and return a 500 status with an error message
        logger.error(error, 'Error updating course in DB:');
        res.status(500).json({
            error: 'Error updating course in DB',
            errorMessage: error.message,
        });
    }
});

router.get('/common2', async (req, res) => {
    try {
        const common2 = await models.course.findAll({
            where: {
                type: 'common2',
            },
            include: [
                {
                    model: models.programCourse,
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    'name',
                    'id',
                    'semester',
                    [sequelize.col('programCourses.program_id'), 'programId'],
                ],
            },
            raw: true,
        });
        res.json(common2);
    } catch (error) {
        logger.error(error, 'Error while fetching /common2');
        res.status(500).json({
            message: 'An error occurred while retrieving common2 courses.',
        });
    }
});

export default router;
