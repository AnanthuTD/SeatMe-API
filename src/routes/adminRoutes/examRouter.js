import express from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import dayjs from '../../helpers/dayjs.js';
import {
    getOngoingExamCount,
    getExams,
    setExam,
} from '../../helpers/adminHelpers/adminHelper.js';
import { assignSeats } from '../../helpers/seatAssignment/assignSeats.js';
import {
    createRecord,
    retrieveAndStoreExamsInRedis,
} from '../../helpers/adminHelpers/studentSeat.js';
import { models, sequelize } from '../../sequelize/models.js';
import generateTeacherDetailsPDF from '../../helpers/adminHelpers/staffAssignmentPDF.js';
import getRootDir from '../../../getRootDir.js';
import logger from '../../helpers/logger.js';

const router = express.Router();
const reportsDir = `${getRootDir()}/reports`;

router.get('/count', async (req, res) => {
    try {
        const count = await getOngoingExamCount();
        res.json(count);
    } catch (error) {
        logger.error(`Error in GET /exams/count: ${error.message}`);
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
        limit = parseInt(limit, 10) || null;

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
        logger.error(`Error in GET /exams: ${error.message}`);
        return res.status(500).json({ error: 'Error fetching exams' });
    }
});

router.get('/assign', async (req, res) => {
    try {
        const { orderBy, examType, timeCode = 'AN', examName } = req.query;

        let { date } = req.query;

        const currentDate = dayjs();
        const providedDate = dayjs(date).tz('Asia/Kolkata');

        if (providedDate.isBefore(currentDate, 'day')) {
            return res
                .status(400)
                .json({ error: 'Date should not be in the past' });
        }

        const year = providedDate.year();
        const month = String(providedDate.month() + 1).padStart(2, '0');
        const day = String(providedDate.date()).padStart(2, '0');

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

        const outputFileName = `${fileName}.zip`;

        const outputFilePath = path.join(reportsDir, outputFileName);

        const archive = archiver('zip', { zlib: { level: 9 } });

        const output = fs.createWriteStream(outputFilePath);
        archive.pipe(output);

        const pdfDir = `${getRootDir()}/pdf`;

        fs.readdirSync(pdfDir).forEach((file) => {
            const filePath = path.join(pdfDir, file);
            archive.file(filePath, { name: file });
        });

        await archive.finalize();

        let errorMessage = null;
        if (totalUnassignedStudents > 0) {
            errorMessage = `There are ${totalUnassignedStudents} unassigned students. Please add more rooms to accommodate them and try again. No record has been created.`;
        }
        res.status(201).json({
            fileName: outputFileName,
            error: errorMessage,
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

                logger.trace('PDF files removed.');
            } catch (error) {
                logger.error('Error removing PDF files:', error);
            }
        });
    } catch (error) {
        logger.error('Error in ( /exam/assign ): ', error);
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
        if (status) {
            res.status(200).send(
                `Exam for course ${courseName}(${courseId}) has been set for ${date}.`,
            );
            retrieveAndStoreExamsInRedis();
        } else
            res.status(404).send(`Course ${courseName}(${courseId}) not found`);
    } catch (error) {
        logger.error(`Error in POST /timetable: ${error.message}`);
        res.status(500).json({
            error: 'Error processing the timetable request',
        });
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
        logger.error(error);
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
        logger.error(error);
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
        logger.error('Error:', error);
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
        logger.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:date/:timeCode/rooms', async (req, res) => {
    try {
        let { date, timeCode } = req.params;
        date = new dayjs(date);

        const rooms = await models.room.findAll({
            attributes: [
                'id',
                'blockId',
                'isAvailable',
                'floor',
                [sequelize.col('teacherSeats.authUser.name'), 'name'],
                [
                    sequelize.col('teacherSeats.authUser.department.name'),
                    'departmentName',
                ],
            ],
            include: [
                {
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
                {
                    model: models.teacherSeat,
                    include: [
                        {
                            model: models.dateTime,
                            where: { date, timeCode },
                            required: true,
                            attributes: [],
                        },
                        {
                            model: models.authUser,
                            attributes: ['name'],
                            include: {
                                model: models.department,
                                attributes: ['name'],
                            },
                        },
                    ],
                    attributes: ['id'],
                    required: false,
                },
            ],
        });

        return res.json(rooms);
    } catch (error) {
        logger.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('');

export default router;
