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
router.post('/staff', async (req, res) => {
    const { staffs } = req.body;

    const result = await createStaff(staffs);

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

    if (!column.every((col) => allowedColumns.includes(col))) {
        column = ['id'];
    }

    query = query || [''];
    sortField = sortField || 'updatedAt';
    sortOrder = sortOrder || 'DESC';
    offset = parseInt(offset, 10) || 0;
    limit = parseInt(limit, 10) || 10;

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
        'dateTimes.date',
        'dateTimes.timeCode',
    ];

    if (!allowedColumns.includes(column)) {
        column = 'dateTimes.date';
    }

    query = query || '';
    sortField = sortField || 'dateTimes.date';
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
    const { orderBy, examType } = req.query;
    let { date } = req.query;

    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0];
    let fileName = '';

    try {
        date = new Date(date);
        const providedDateString = date?.toISOString()?.split('T')[0];
        if (providedDateString < currentDateString) {
            return res
                .status(400)
                .json({ error: 'Date should not be in the past' });
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        fileName = `${
            examType ? `${examType}-` : ''
        }${year}-${month}-${day}.pdf`;
    } catch (error) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    if (!['rollNumber', 'id'].includes(orderBy)) {
        return res.status(400).json({ error: 'Invalid orderBy value' });
    }

    const [seating, totalUnassignedStudents] = await assignSeats({
        date,
        orderBy,
        fileName,
    });

    if (totalUnassignedStudents > 0)
        return res.status(200).json({
            message: `There are ${totalUnassignedStudents} unassigned students. Please add more rooms to accommodate them and try again. No record has been created.`,
        });

    await createRecord(seating);

    return res.status(201).json({ fileName });
});

router.get('/public/:fileName', (req, res) => {
    const { fileName } = req.params;

    // Validate and sanitize the fileName to prevent directory traversal attacks
    if (fileName.includes('..')) {
        return res.status(400).send('Invalid file name');
    }

    const filePath = path.join(getRootDir(), 'pdf', fileName);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Set the Content-Disposition header for download
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`,
        );

        // Stream the file to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } else {
        // Handle the case when the file does not exist
        res.status(404).send('File not found');
    }
});

router.delete('/public/:fileName', (req, res) => {
    const { fileName } = req.params;

    // Validate and sanitize the fileName to prevent directory traversal attacks
    if (fileName.includes('..')) {
        return res.status(400).send('Invalid file name');
    }

    const filePath = path.join(getRootDir(), 'pdf', fileName);

    try {
        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Attempt to remove the file
            fs.unlinkSync(filePath);
            res.status(204).send(); // Send a success response with no content
        } else {
            // Handle the case when the file does not exist
            res.status(404).send('File not found');
        }
    } catch (error) {
        console.error('Error removing file:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/list-pdfs', async (req, res) => {
    const pdfDirectory = path.join(getRootDir(), 'pdf');
    try {
        const files = await fs.promises.readdir(pdfDirectory);

        // Use Promise.all to asynchronously get file metadata
        const pdfListPromises = files.map(async (file) => {
            const filePath = path.join(pdfDirectory, file);
            const stats = await fs.promises.stat(filePath);

            return {
                name: file,
                created: stats.birthtime,
            };
        });

        const pdfList = await Promise.all(pdfListPromises);

        pdfList.sort((a, b) => b.created - a.created);

        const sortedFileNames = pdfList.map((file) => file.name);

        res.json(sortedFileNames);
    } catch (error) {
        console.error('Error listing PDFs: ', error);
        res.status(500).send('Error listing PDFs.');
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
