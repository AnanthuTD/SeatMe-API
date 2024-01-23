import express from 'express';
import {
    getUpcomingExams,
    getUpcomingExamsFromDB,
    retrieveStudentDetails,
} from '../helpers/adminHelpers/studentSeat.js';
import {
    checkSameStudent,
    checkSeatingAvailability,
} from '../middlewares/userMiddleware.js';
import logger from '../helpers/logger.js';

const router = express.Router();

/**
 * Get timetable and seating information for a student.
 * @route GET /api/students
 * @param {string} studentId - The student's ID.
 * @returns {object} - The timetable and seating information.
 * @throws {object} - Returns an error object if any error occurs.
 */
router.get(
    '/',
    checkSameStudent,
    checkSeatingAvailability,
    async (req, res) => {
        try {
            const { studentId } = req.query;

            const seatingInfo = await retrieveStudentDetails(studentId);

            if (!seatingInfo) {
                return res
                    .status(204)
                    .json({ error: 'Student details not found' });
            }

            logger.trace(seatingInfo.timeCode, req.timeCode);

            if (seatingInfo.timeCode !== req.timeCode)
                return res.status(403).json({
                    error: 'Seating arrangement not available at this time.',
                });

            const { programId, semester, openCourseId } =
                seatingInfo?.student || {};

            logger.trace(seatingInfo, 'seating info');

            res.cookie('programId', programId);
            res.cookie('semester', semester);
            res.cookie('openCourseId', openCourseId);

            return res.json({ seatingInfo });
        } catch (error) {
            logger.error(error, 'An error occurred:');
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
);

router.get('/exams', async (req, res) => {
    try {
        const { programId, semester, openCourseId, studentId } = req.cookies;

        if (!studentId || !programId || !semester)
            return res.status(400).json({
                error: 'No necessary data to process the request!',
            });

        let upcomingExams = [];

        if (programId && semester) {
            upcomingExams = await getUpcomingExams(
                programId,
                semester,
                openCourseId,
            );
        }

        return res.status(200).json(upcomingExams);
    } catch (error) {
        logger.error(error, 'An error occurred:');

        const { studentId } = req.cookies;
        if (!studentId)
            return res
                .status(500)
                .json({ error: 'Failed to load data from redis and db!' });
        try {
            const upcomingExams = await getUpcomingExamsFromDB(studentId);

            return res.status(200).json(upcomingExams);
        } catch (err) {
            logger.error(err, 'An error occurred:');
            return res.status(500).json({ err: 'Internal Server Error' });
        }
    }
});

/* router.get('/exams/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const upcomingExams = await getUpcomingExamsFromDB(studentId);

        return res.status(200).json(upcomingExams);
    } catch (error) {
        logger.error(error,'An error occurred:');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}); */

export default router;
