import express from 'express';

import {
    getOngoingExamCount,
    getExams,
    updateCoursesDateTime,
} from '../../helpers/adminHelpers/adminHelper.js';

import { assignSeats } from '../../helpers/seatAssignment/assignSeats.js';

import { createRecord } from '../../helpers/adminHelpers/studentSeat.js';

import { models, sequelize } from '../../sequelize/models.js';

import generateTeacherDetailsPDF from '../../helpers/adminHelpers/staffAssignmentPDF.js';
import course from '../../sequelize/models/course.js';
import logger from '../../helpers/logger.js';

const router = express.Router();

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

        res.json(data);
    } catch (error) {
        console.error(`Error in GET /exams: ${error.message}`);
        res.status(500).json({ error: 'Error fetching exams' });
    }
});

router.get('/assign', async (req, res) => {
    try {
        const { orderBy, examType } = req.query;

        let { optimize } = req.query;
        optimize = optimize === 'true' || optimize === '1';

        let { date } = req.query;

        const currentDate = new Date();
        const currentDateString = currentDate.toISOString().split('T')[0];
        let fileName = '';

        date = new Date(date);

        const providedDateString = date.toISOString().split('T')[0];
        if (providedDateString < currentDateString) {
            return res
                .status(400)
                .json({ error: 'Date should not be in the past' });
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        fileName = `${examType ? `${examType}-` : ''}${year}-${month}-${day}`;

        if (!['rollNumber', 'id'].includes(orderBy)) {
            return res.status(400).json({ error: 'Invalid orderBy value' });
        }

        const [seating, totalUnassignedStudents] = await assignSeats({
            date,
            orderBy,
            fileName,
            optimize,
        });

        await createRecord(seating);

        if (totalUnassignedStudents > 0) {
            return res.status(200).json({
                message: `There are ${totalUnassignedStudents} unassigned students. Please add more rooms to accommodate them and try again. No record has been created.`,
            });
        }

        return res.status(201).json({ fileName: `${fileName}.pdf` });
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

        const status = await updateCoursesDateTime(body);
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
            res.json(programs);
        } else {
            // Exam not found
            res.status(404).json({ error: 'Exam not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get exam' });
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

export default router;