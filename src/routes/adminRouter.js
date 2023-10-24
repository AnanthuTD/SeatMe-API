import fs from 'fs';
import path from 'path';
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
    getOngoingExamCount,
    getExams,
    getRooms,
    updateRoomAvailability,
    getExamDateTime,
    countExamsForDate,
    updateStudent,
    findOrCreateStudents,
    getAvailableOpenCourses,
    deleteStudent,
    findStudentsByProgramSem,
} from '../helpers/adminHelpers/adminHelper.js';
import { assignSeats } from '../helpers/seatAssignment/assignSeats.js';
import { createRecord } from '../helpers/adminHelpers/studentSeat.js';
import getRootDir from '../../getRootDir.js';

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

    if (!column.every((col) => allowedColumns.includes(col))) {
        column = ['id'];
    }

    query = query || [''];
    sortField = sortField || 'updatedAt';
    sortOrder = sortOrder || 'DESC';
    offset = parseInt(offset, 10) || 0;
    limit = parseInt(limit, 10) || 10;

    // console.log('sort order: ', sortOrder);

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
    const count = await getOngoingExamCount();
    res.json(count);
});

router.get('/exam', async (req, res) => {
    const { courseId } = req.query;
    const examDateTime = await getExamDateTime({ courseId });
    if (examDateTime) {
        res.json(examDateTime);
        return;
    }
    res.sendStatus(204);
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

router.get('/examines-count', async (req, res) => {
    const { date } = req.query;
    const count = await countExamsForDate({ targetDate: date });
    res.json(count);
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

router.get('/exam/assign', async (req, res) => {
    const { date, orderBy } = req.query;
    const currentDate = new Date();

    const currentDateString = currentDate.toISOString().split('T')[0];

    try {
        console.log(date);
        const providedDateString = date.split('T')[0];
        if (providedDateString < currentDateString) {
            return res
                .status(400)
                .json({ error: 'Date should not be in the past' });
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    if (!['rollNumber', 'id'].includes(orderBy)) {
        return res.status(400).json({ error: 'Invalid orderBy value' });
    }

    const [seating, totalUnassignedStudents, fileName] = await assignSeats({
        date,
        orderBy,
    });

    if (totalUnassignedStudents > 0)
        return res.status(200).json({
            message: `There are ${totalUnassignedStudents} unassigned students. Please add more rooms to accommodate them and try again. No record has been created.`,
        });

    await createRecord(seating);

    /*  let modifiedSeating = seating.map((value) => {
        let length = 0;
        value.exams.forEach((element) => {
            length =
                length < element.examines.length
                    ? element.examines.length
                    : element;
        });
        let tempArray = [];
        for (let index = 0; index < length; index += 1) {
            let element = {};
            value.exams.map((exam) => {
                if (exam.examines.length > 0) {
                    element[`${exam.name}`] = exam.examines.shift();
                }
            });
            console.log(element);
            tempArray.push(element);
        }
        // console.log('modified: ', JSON.stringify(tempArray, null, 2));
        return tempArray.flat();
    });

    console.log('modified: ', JSON.stringify(seating, null, 2)); */

    return res.status(201).json({ fileName });
});

router.get('/public/:fileName', (req, res) => {
    const { fileName } = req.params;
    console.log(fileName);
    const filePath = path.join(getRootDir(), 'public', fileName);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        // Handle the case when the file does not exist
        res.status(404).send('File not found');
    }
});

router.post('/student', async (req, res) => {
    const { students } = req.body;

    if (!students) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    const result = await findOrCreateStudents(students);

    if (result) return res.status(200).json(result);
    return res.status(400).json(result);
});

router.patch('/student', async (req, res) => {
    const students = req.body;

    // console.log(JSON.stringify(students, null, 2));

    if (!students.length) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    const notUpdatedStudents = await updateStudent(students);

    return res.status(200).json(notUpdatedStudents);
});

router.delete('/student', async (req, res) => {
    const { studentId } = req.query;

    if (!studentId) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    try {
        const deletionCount = await deleteStudent(studentId);

        if (deletionCount > 0) {
            return res.status(200).json({
                message: `Student with ID ${studentId} deleted successfully.`,
            });
        }
        return res
            .status(404)
            .json({ error: `Student with ID ${studentId} not found` });
    } catch (error) {
        console.error('Error deleting student:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/open-courses', async (req, res) => {
    const { programId, isAided } = req.query;

    if (!programId || !isAided) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    const openCourses = await getAvailableOpenCourses(programId, isAided);

    return res.status(200).json(openCourses);
});

router.get('/students/pro-sem', async (req, res) => {
    try {
        const { programId, semester } = req.query;

        // Perform the query to fetch students based on program and semester
        const students = await findStudentsByProgramSem(programId, semester);

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Error fetching students' });
    }
});

export default router;
