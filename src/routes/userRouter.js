import express from 'express';
import {
    getUpcomingExams,
    getUpcomingExamsFromDB,
    retrieveStudentDetails,
} from '../helpers/adminHelpers/studentSeat.js';
import logger from '../helpers/logger.js';

const router = express.Router();

/**
 * Get timetable and seating information for a student.
 * @route GET /api/students
 * @param {string} studentId - The student's ID.
 * @returns {object} - The timetable and seating information.
 * @throws {object} - Returns an error object if any error occurs.
 */
router.get('/', async (req, res) => {
    try {
        const { studentId } = req.query;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required.' });
        }

        const seatingInfo = await retrieveStudentDetails(studentId);

        if (!seatingInfo) {
            return res.status(404).json({ error: 'Student details not found' });
        }

        return res.json({ seatingInfo });
    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/exams', async (req, res) => {
    try {
        const { programId, semester, openCourseId } = req.query;

        let upcomingExams = [];

        if (programId && semester) {
            upcomingExams = await getUpcomingExams(
                programId,
                semester,
                openCourseId,
            );
        }

        return res
            .status(upcomingExams.length > 0 ? 200 : 204)
            .json(upcomingExams);
    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/exams/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const upcomingExams = await getUpcomingExamsFromDB(studentId);

        return res
            .status(upcomingExams.length > 0 ? 200 : 204)
            .json(upcomingExams);
    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
