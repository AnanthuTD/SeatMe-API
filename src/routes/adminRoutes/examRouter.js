import express from 'express';
import dayjs from 'dayjs';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import {
    getOngoingExamCount,
    getExams,
    setExam,
} from '../../helpers/adminHelpers/adminHelper.js';
import { assignSeats } from '../../helpers/seatAssignment/assignSeats.js';
import { createRecord } from '../../helpers/adminHelpers/studentSeat.js';
import { models } from '../../sequelize/models.js';
import generateTeacherDetailsPDF from '../../helpers/adminHelpers/staffAssignmentPDF.js';
import getRootDir from '../../../getRootDir.js';

const router = express.Router();
const zipDir = `${getRootDir()}/zip`;

router.get('/count', async (req, res) => {
    try {
        const count = await getOngoingExamCount();
        res.json(count);
    } catch (error) {
        console.error(`Error in GET /exams/count: ${error.message}`);
        res.status(500).json({ error: 'Error fetching exam count' });
    }
});

router.get('/', async (req, res) => {
    try {
        let { query, column, offset, limit, sortField, sortOrder } = req.query;

        column = column || 'course.id';

        const allowedColumns = [
            'course.id',
            'course.name',
            'course.semester',
            'date',
            'timeCode',
        ];

        if (!allowedColumns.includes(column)) {
            return res.sendStatus(400);
        }

        query = query || '';
        sortField = sortField || 'date';
        sortOrder = sortOrder || 'DESC';
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

        return res.json(data);
    } catch (error) {
        console.error(`Error in GET /exams: ${error.message}`);
        return res.status(500).json({ error: 'Error fetching exams' });
    }
});

router.get('/assign', async (req, res) => {
    try {
        const { orderBy, examType, timeCode = 'AN', examName } = req.query;

        let { date } = req.query;

        const currentDate = dayjs();
        const providedDate = dayjs(date);

        if (providedDate.isBefore(currentDate, 'day')) {
            return res
                .status(400)
                .json({ error: 'Date should not be in the past' });
        }

        const year = providedDate.year();
        const month = String(providedDate.month() + 1).padStart(2, '0');
        const day = String(providedDate.date()).padStart(2, '0');
        /* let fileName = `${
            examType ? `${examType}-` : ''
        }${year}-${month}-${day}-${timeCode}`; */

        let fileName = `${examName}-${year}-${month}-${day}-${timeCode}`;

        if (!['rollNumber', 'id'].includes(orderBy)) {
            return res.status(400).json({ error: 'Invalid orderBy value' });
        }

        const [seating, totalUnassignedStudents] = await assignSeats({
            date,
            timeCode,
            orderBy,
            fileName,
            examType,
            examName,
        });

        await createRecord(seating);

        if (totalUnassignedStudents > 0) {
            return res.status(422).json({
                error: `There are ${totalUnassignedStudents} unassigned students. Please add more rooms to accommodate them and try again. No record has been created.`,
            });
        }

        const outputFilePath = path.join(zipDir, `${fileName}.zip`);

        const archive = archiver('zip', { zlib: { level: 9 } });

        const output = fs.createWriteStream(outputFilePath);
        archive.pipe(output);

        const pdfDir = `${getRootDir()}/pdf`;

        fs.readdirSync(pdfDir).forEach((file) => {
            const filePath = path.join(pdfDir, file);
            archive.file(filePath, { name: file });
        });

        archive.finalize();

        res.status(201).json({
            fileName,
            message: 'Zip file created. Ready to download.',
        });

        // After the response is sent, remove the PDF files asynchronously
        output.on('close', async () => {
            try {
                const files = fs.readdirSync(pdfDir);
                await Promise.all(
                    files.map(async (file) => {
                        const filePath = path.join(pdfDir, file);
                        await fs.promises.unlink(filePath);
                    }),
                );

                console.log('PDF files removed.');
            } catch (error) {
                console.error('Error removing PDF files:', error);
            }
        });
    } catch (error) {
        console.error('Error in ( /exam/assign ): ', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/timetable', async (req, res) => {
    try {
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

        const status = await setExam(body);
        if (status)
            res.status(200).send(
                `Exam for course ${courseName}(${courseId}) has been set for ${date}.`,
            );
        else
            res.status(404).send(`Course ${courseName}(${courseId}) not found`);
    } catch (error) {
        console.error(`Error in POST /timetable: ${error.message}`);
        res.status(500).json({
            error: 'Error processing the timetable request',
        });
    }
});

router.post('/assign-teacher', async (req, res) => {
    try {
        const { dateTimeId, ...assignments } = req.body;
        const roomIds = Object.keys(assignments);
        const failedAssignments = [];

        // Use Promise.all to process all assignments concurrently
        await Promise.all(
            roomIds.map(async (roomId) => {
                const authUserId = assignments[roomId];

                try {
                    // Try to find an existing assignment
                    const existingAssignment = await models.teacherSeat.findOne(
                        {
                            where: { roomId, dateTimeId },
                        },
                    );

                    if (existingAssignment) {
                        // If an assignment already exists, update it
                        await existingAssignment.update({ authUserId });
                    } else {
                        const insertData = {
                            roomId,
                            authUserId,
                            dateTimeId,
                        };

                        // If no assignment exists, create a new one
                        await models.teacherSeat.create(insertData);
                    }
                } catch (error) {
                    console.error(error);
                    failedAssignments.push({ roomId, authUserId });
                }
            }),
        );

        await generateTeacherDetailsPDF(dateTimeId);

        if (failedAssignments.length > 0) {
            res.status(200).json({
                error: 'Some assignments failed to update or create',
                failedAssignments,
            });
        } else {
            res.status(200).json({ message: 'Teachers assigned successfully' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to assign teachers' });
    }
});

router.get('/:examId', async (req, res) => {
    try {
        const { examId } = req.params;

        // Check if examId is a valid number
        if (Number.isNaN(examId) || examId <= 0) {
            return res.status(400).json({ error: 'Invalid examId' });
        }

        // Use await to wait for the findByPk operation
        const programs = await models.exam.findByPk(examId, {
            include: [
                {
                    model: models.course,
                    attributes: ['id', 'semester', 'name'],
                    include: [
                        {
                            model: models.program,
                            through: {
                                model: models.programCourse,
                                attributes: [],
                            },
                        },
                    ],
                },
            ],
            attributes: [],
        });

        // Handle the result
        if (programs) {
            // Exam found, send it in the response
            return res.json(programs);
        }
        // Exam not found
        return res.status(404).json({ error: 'Exam not found' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to get exam' });
    }
});

router.get('/attendance/:examId/:programId', async (req, res) => {
    try {
        const { examId, programId } = req.params;

        const attendance = await models.studentSeat.findAll({
            where: { examId },
            include: [
                {
                    model: models.student,
                    where: { programId },
                },
            ],
            order: [[models.student, 'id', 'ASC']],
            raw: true,
        });

        if (attendance) {
            // Exam found, send it in the response
            res.json(attendance);
        } else {
            // Exam not found
            res.status(404).json({ error: 'Exam not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get attendance' });
    }
});

router.put('/:examId', async (req, res) => {
    try {
        const { examId } = req.params;
        const { date, timeCode } = req.body;

        // Find or create a dateTime record
        const [dateTimeInstance] = await models.dateTime.findOrCreate({
            where: { date, timeCode },
        });

        // Update the exam with the new dateTimeId
        const [updatedCount] = await models.exam.update(
            { dateTimeId: dateTimeInstance.id },
            { where: { id: examId } },
        );

        // Check if the update was successful
        if (updatedCount > 0) {
            return res.sendStatus(200);
        }
        // If the exam with the given ID doesn't exist
        return res.status(404).json({ error: 'Exam not found' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:examId', async (req, res) => {
    try {
        const { examId } = req.params;

        // Delete the exam with the given ID
        const deletedCount = await models.exam.destroy({
            where: { id: examId },
        });

        if (deletedCount > 0) {
            // If the exam was deleted successfully
            return res.sendStatus(200);
        }

        // If the exam with the given ID doesn't exist
        return res.status(404).json({ error: 'Exam not found' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:date/:timeCode/rooms', async (req, res) => {
    try {
        let { date, timeCode } = req.params;
        date = new Date(date);

        const rooms = await models.room.findAll({
            attributes: ['id', 'blockId', 'isAvailable', 'floor'],
            include: {
                model: models.studentSeat,
                include: {
                    model: models.exam,
                    include: {
                        model: models.dateTime,
                        where: { date, timeCode },
                        required: true,
                        attributes: [],
                    },
                    required: true,
                    attributes: [],
                },
                required: true,
                attributes: [],
            },
        });

        return res.json(rooms);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
