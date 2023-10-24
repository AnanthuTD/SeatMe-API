import express from 'express';
import { getTimeTableAndSeating } from '../helpers/adminHelpers/studentSeat.js';

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
        const data = await getTimeTableAndSeating(studentId);

        if (!data) {
            return res.status(404).json({ error: 'Data not found' });
        }

        const restructuredData = data.map((item) => ({
            courseId: item.id,
            courseName: item.name,
            programId: item.programCourses[0]?.programId || null,
            date: item.exams[0]?.dateTime.date || null,
            timeCode: item.exams[0]?.dateTime.timeCode || null,
            seatNumber: item.exams[0]?.studentSeats[0]?.seatNumber || null,
            studentId: item.exams[0]?.studentSeats[0]?.studentId || null,
            isPresent: item.exams[0]?.studentSeats[0]?.isPresent || null,
            roomId: item.exams[0]?.studentSeats[0]?.room?.id || null,
            floor: item.exams[0]?.studentSeats[0]?.room?.floor || null,
            blockId: item.exams[0]?.studentSeats[0]?.room?.blockId || null,
        }));

        return res.json(restructuredData);
    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
