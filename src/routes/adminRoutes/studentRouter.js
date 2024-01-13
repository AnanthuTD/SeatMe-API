import express from 'express';
import { Op } from 'sequelize';
import dayjs from '../../helpers/dayjs.js';
import {
    getStudentCount,
    findStudent,
    updateStudent,
    upsertStudents,
    deleteStudent,
    findStudentsByProgramSem,
    deleteSupply,
} from '../../helpers/adminHelpers/adminHelper.js';
import logger from '../../helpers/logger.js';
import { models } from '../../sequelize/models.js';
import {
    deleteSupplement,
    findSupplementaryStudents,
} from '../../helpers/adminHelpers/studentHelpers.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { students } = req.body;

    logger(students, 'Student');

    if (!students) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    try {
        const { success, uncreatedStudents, error } = await upsertStudents(
            students,
        );

        return res.status(200).json({ failedRecords: uncreatedStudents });
    } catch (error) {
        const errorMessage = `Error in POST /student: ${error.message}`;
        console.error(errorMessage);
        console.error(error);
        return res.status(500).send(errorMessage);
    }
});

router.patch('/', async (req, res) => {
    const student = req.body;

    if (!student) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    try {
        const updateCount = await updateStudent(student);
        if (updateCount > 0) {
            return res.status(200).json({
                message: `Update successful.`,
            });
        }
        return res.status(404).json({ error: 'Student not found!' });
    } catch (error) {
        console.error(`Error in PATCH /student: ${error.message}`);
        return res.status(500).json({ error: 'Error updating students' });
    }
});

router.delete('/', async (req, res) => {
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
        console.error(`Error in DELETE /student: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/count', async (req, res) => {
    try {
        const { programId, semester } = req.query || {};
        const count = await getStudentCount(programId, semester);
        res.json(count);
    } catch (error) {
        console.error(`Error in GET /student/count: ${error.message}`);
        res.status(500).json({ error: 'Error counting students' });
    }
});

router.get('/list', async (req, res) => {
    try {
        let { query, column, offset, limit, sortField, sortOrder } = req.query;

        const allowedColumns = [
            'id',
            'name',
            'rollNumber',
            'semester',
            'program.name',
            'programId',
        ];

        // Validate and adjust the 'column' parameter
        if (
            !Array.isArray(column) ||
            !column.every((col) => allowedColumns.includes(col))
        ) {
            column = ['id'];
        }

        query = query || [''];
        sortField = sortField || 'updatedAt';
        sortOrder = sortOrder || 'DESC';
        offset = parseInt(offset, 10) || 0;
        limit = parseInt(limit, 10) || 10;

        const data = await findStudent(
            query,
            column,
            offset,
            limit,
            sortField,
            sortOrder,
        );

        res.json(data);
    } catch (error) {
        console.error(`Error in GET /student/list: ${error.message}`);
        res.status(500).json({ error: 'Error fetching student list' });
    }
});

router.get('/pro-sem', async (req, res) => {
    const { programId, semester } = req.query;

    try {
        // Perform the query to fetch students based on program and semester
        const students = await findStudentsByProgramSem(programId, semester);

        return res.status(200).json(students);
    } catch (error) {
        console.error(`Error in GET /students/pro-sem: ${error.message}`);
        return res.status(500).json({ error: 'Error fetching students' });
    }
});

router.post('/supplementary', async (req, res) => {
    const { courseIds, studentIds } = req.body;
    const failedRecords = [];

    try {
        await Promise.all(
            courseIds.map(async (courseId) => {
                if (!courseId) return;
                const exam = await models.exam.findOne({
                    where: { courseId },
                    include: [
                        {
                            model: models.dateTime,
                            where: { date: { [Op.gte]: new dayjs() } },
                            required: true,
                            attributes: [],
                        },
                    ],
                    attributes: ['id'],
                });

                if (!exam?.id) return;

                return Promise.all(
                    // Add return here
                    studentIds.map(async (studentId) => {
                        if (!studentId) return;
                        try {
                            console.log(courseId, studentId);
                            await models.supplementary.upsert({
                                examId: exam.id,
                                studentId,
                            });
                        } catch (error) {
                            console.log(error);
                            failedRecords.push({
                                courseId,
                                studentId,
                                error: error.message,
                            });
                        }
                    }),
                );
            }),
        );

        res.status(200).json({
            failedRecords,
        });
    } catch (error) {
        console.error('Error creating records:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/supplementary', async (req, res) => {
    try {
        let { date, courseIds } = req.query;

        console.log(req.query);

        const data = await findSupplementaryStudents({ date, courseIds });

        res.json(data);
    } catch (error) {
        console.error(`Error in GET /student/list: ${error.message}`);
        res.status(500).json({ error: 'Error fetching student list' });
    }
});

router.patch('/supplementary', async (req, res) => {
    const student = req.body;
    logger(student);

    if (!student) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    const examIds = student.exams.map((exam) => exam.examId);

    try {
        const deleteCount = await deleteSupplement(student.id, examIds);
        if (deleteCount > 0) {
            return res.status(200).json({
                message: `Update successful.`,
            });
        }
        return res.status(404).json({ error: 'Student not found!' });
    } catch (error) {
        console.error(`Error in PATCH /student: ${error}`, error);
        return res.status(500).json({ error: 'Error updating students' });
    }
});

router.delete('/supplementary/:supplyId', async (req, res) => {
    const { supplyId } = req.params;

    if (!supplyId) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    try {
        const deletionCount = await deleteSupply(supplyId);

        if (deletionCount > 0) {
            return res.status(200).json({
                message: `Supply ID ${supplyId} deleted successfully.`,
            });
        }
        return res
            .status(404)
            .json({ error: `Supply ID ${supplyId} not found` });
    } catch (error) {
        console.error(`Error in DELETE /student: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
