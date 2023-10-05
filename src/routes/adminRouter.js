import express from 'express';
import { createStaff } from '../helpers/bcryptHelper.js';
import {
    getStaffCount,
    getStaffs,
    getStudentCount,
    findStudent,
    getDepartments,
    getPrograms,
    getCourses,
    updateCoursesDateTime,
    getExamCount,
    getExams,
    getRooms,
    updateRoomAvailability,
} from '../helpers/adminHelpers/adminHelper.js';

const router = express.Router();

/**
 * @route GET /admin
 * @desc Display the admin page.
 */
router.get('/', (req, res) => {
    res.send('admin page');
});

/**
 * @route POST /admin/create-staff
 * @desc Create a new staff member.
 * @param {object} req.body.staffData - The user data for the new staff member.
 * @returns {object} Response object with status and message indicating the result of the operation.
 */
router.post('/create-staff', async (req, res) => {
    const { staffData } = req.body;

    const result = await createStaff(staffData);

    return res.status(result.status).json(result);
});

router.get('/staff/count', async (req, res) => {
    const count = await getStaffCount();
    res.json(count);
});

router.get('/staff/list', async (req, res) => {
    let { query, column, offset, limit, sortField, sortOrder } = req.query;

    const allowedColumns = [
        'id',
        'name',
        'rollNumber',
        'semester',
        'program.name',
        'programId',
    ];

    if (!allowedColumns.includes(column)) {
        column = 'id';
    }

    query = query || '';
    sortField = sortField || 'updatedAt';
    sortOrder = sortOrder || 'DESC';
    offset = parseInt(offset, 10) || 0;
    limit = parseInt(limit, 10) || 10;

    console.log('sort order: ', sortOrder);

    const data = await getStaffs(
        query,
        column,
        offset,
        limit,
        sortField,
        sortOrder,
    );

    res.json(data);
});

router.get('/student/count', async (req, res) => {
    const count = await getStudentCount();
    res.json(count);
});

router.get('/student/list', async (req, res) => {
    let { query, column, offset, limit, sortField, sortOrder } = req.query;

    const allowedColumns = [
        'id',
        'name',
        'rollNumber',
        'semester',
        'program.name',
        'programId',
    ];

    if (!allowedColumns.includes(column)) {
        column = 'id';
    }

    query = query || '';
    sortField = sortField || 'updatedAt';
    sortOrder = sortOrder || 'DESC';
    offset = parseInt(offset, 10) || 0;
    limit = parseInt(limit, 10) || 10;

    console.log('sort order: ', sortOrder);

    const data = await findStudent(
        query,
        column,
        offset,
        limit,
        sortField,
        sortOrder,
    );

    res.json(data);
});

router.get('/departments', async (req, res) => {
    const departments = await getDepartments();
    res.json(departments);
});
router.get('/programs', async (req, res) => {
    let { departmentId } = req.query;
    departmentId = parseInt(departmentId, 10) || 0;

    const programs = await getPrograms(departmentId);

    res.json(programs);
});
router.get('/courses', async (req, res) => {
    const { programId, semester } = req.query;
    console.log('semester: ', semester);
    const courses = await getCourses(programId, semester);
    res.json(courses);
});

router.post('/timetable', async (req, res) => {
    const { body } = req;
    const { courseId, timeCode, date } = body;
    let { courseName } = body;

    courseName = courseName || '';
    const missingProperties = [];

    if (!courseId) missingProperties.push('courseId');

    if (!timeCode) missingProperties.push('timeCode');

    if (!date) missingProperties.push('date');

    if (missingProperties.length > 0) {
        const errorMessage = `The following properties are missing: ${missingProperties.join(
            ', ',
        )}`;

        res.status(400).send(errorMessage);
        return;
    }
    const status = await updateCoursesDateTime(body);
    if (status)
        res.status(200).send(
            `Exam for course ${courseName}(${courseId}) has been set for ${date}.`,
        );
    else res.status(404).send(`Course ${courseName}${courseId} not found`);
});

router.get('/exams/count', async (req, res) => {
    const count = await getExamCount();
    res.json(count);
});

router.get('/exams', async (req, res) => {
    let { query, column, offset, limit, sortField, sortOrder } = req.query;

    const allowedColumns = [
        'id',
        'name',
        'semester',
        'dateTime.date',
        'dateTime.timeCode',
    ];

    if (!allowedColumns.includes(column)) {
        column = 'id';
    }

    query = query || '';
    sortField = sortField || 'name';
    sortOrder = sortOrder || 'ASC';
    offset = parseInt(offset, 10) || 0;
    limit = parseInt(limit, 10) || 10;

    // sortOrder = 'DESC';
    console.log('sort order: ', sortOrder);

    const data = await getExams({
        query,
        column,
        offset,
        limit,
        sortField,
        sortOrder,
    });

    res.json(data);
});

router.get('/rooms', async (req, res) => {
    const rooms = await getRooms();
    res.json(rooms);
});

router.patch('/rooms', async (req, res) => {
    const { roomIds } = req.body;

    if (!roomIds || !Array.isArray(roomIds)) {
        return res.status(400).json({ error: 'Invalid roomIds' });
    }

    try {
        await updateRoomAvailability({ roomIds });
        res.json({ message: 'Room availability updated successfully' });
    } catch (error) {
        console.error('Error updating room availability:', error);
        res.status(500).json({ error: 'Failed to update room availability' });
    }
    return null;
});

export default router;
