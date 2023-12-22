import express from 'express';

import {
    getStudentCount,
    findStudent,
    updateStudent,
    upsertStudents,
    deleteStudent,
    findStudentsByProgramSem,
} from '../../helpers/adminHelpers/adminHelper.js';
import logger from '../../helpers/logger.js';

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

        if (success) return res.status(200).json(uncreatedStudents);
        return res.status(400).json({ uncreatedStudents, error });
    } catch (error) {
        const errorMessage = `Error in POST /student: ${error.message}`;
        console.error(errorMessage);
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
        const count = await getStudentCount();
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

export default router;
