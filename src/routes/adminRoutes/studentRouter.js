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
import { models, sequelize } from '../../sequelize/models.js';
import {
    deleteSupplement,
    findSupplementaryStudents,
} from '../../helpers/adminHelpers/studentHelpers.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { students } = req.body;

    logger.trace(students, 'Student');

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
        logger.error(errorMessage);
        logger.error(error);
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
        logger.error(`Error in PATCH /student: ${error.message}`);
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
        logger.error(`Error in DELETE /student: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/count', async (req, res) => {
    try {
        const { programId, semester } = req.query || {};
        const count = await getStudentCount(programId, semester);
        res.json(count);
    } catch (error) {
        logger.error(`Error in GET /student/count: ${error.message}`);
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
        logger.error(`Error in GET /student/list: ${error.message}`);
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
        logger.error(`Error in GET /students/pro-sem: ${error.message}`);
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
                            logger.trace(courseId, studentId);
                            await models.supplementary.upsert({
                                examId: exam.id,
                                studentId,
                            });
                        } catch (error) {
                            logger.trace(error);
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
        logger.error(error, 'Error creating records:');
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/supplementary', async (req, res) => {
    try {
        let { date, courseIds } = req.query;

        logger.trace(req.query);

        const data = await findSupplementaryStudents({ date, courseIds });

        res.json(data);
    } catch (error) {
        logger.error(`Error in GET /student/list: ${error.message}`);
        res.status(500).json({ error: 'Error fetching student list' });
    }
});

router.patch('/supplementary', async (req, res) => {
    const student = req.body;
    logger.trace(student);

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
        logger.error(`Error in PATCH /student: ${error}`);
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
        logger.error(`Error in DELETE /student: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

const getMaxSemesterByProgramId = async (programId) => {
    try {
        // Retrieve program duration from the program table
        const program = await models.program.findByPk(programId, {
            attributes: ['duration'],
        });
        if (!program) {
            throw new Error('Program not found');
        }

        const programDuration = program.duration; // Duration of the program in years

        // Calculate maximum semester based on program duration
        const maxSemester = programDuration * 2; // Assuming each year has 2 semesters

        return maxSemester;
    } catch (error) {
        console.error('Error getting maximum semester by program ID:', error);
        throw error;
    }
};

const isMaxSemesterReached = async (currentSemester, programId) => {
    try {
        const maxSemester = await getMaxSemesterByProgramId(programId);

        // Check if the current semester is equal to or greater than the maximum semester
        return currentSemester >= maxSemester;
    } catch (error) {
        console.error('Error checking maximum semester by program ID:', error);
        throw error;
    }
};

router.patch('/promote', async (req, res) => {
    try {
        const { semester, year, program: programId } = req.body;

        if (semester && programId) {
            if (await isMaxSemesterReached(semester, programId))
                return res.json({
                    error: 'max semester for the students have reached!',
                });
            await models.student.update(
                { semester: sequelize.literal('semester + 1') },
                { where: { semester, programId } },
            );
            res.status(200).json({ message: 'Promotion successful' });
        } else if (year) {
            if (year.length > 4) {
                return res.status(400).json({ error: 'Invalid year format' });
            }
            const normalizedYear = year.toString().slice(-2);

            await models.student.update(
                { semester: sequelize.literal('semester + 1') },
                {
                    where: {
                        rollNumber: { [Op.like]: `${normalizedYear}%` },
                    },
                },
            );
            return res.status(200).json({ message: 'Promotion successful' });
        } /* else if (semester) {
            await models.student.update(
                { semester: sequelize.literal('semester + 1') },
                { where: { semester } },
            );
            res.status(200).json({
                message: 'Promotion successful for all students',
            });
        } else if (programId) {
            await models.student.update(
                { semester: sequelize.literal('semester + 1') },
                { where: { programId } },
            );
            return res.status(200).json({
                message: 'Promotion successful for all students',
            });
        }  */ else {
            return res
                .status(400)
                .json({ error: 'Invalid request parameters' });
        }
    } catch (error) {
        // Handle errors
        console.error('Error promoting students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/demote', async (req, res) => {
    try {
        const { semester, year, program: programId } = req.body;

        if (semester && programId) {
            if (semester <= 1) {
                return res.status(400).json({
                    error: 'Semester cannot be demoted further!',
                });
            }

            await models.student.update(
                {
                    semester: sequelize.literal(
                        'CASE WHEN semester > 0 THEN semester - 1 ELSE 0 END',
                    ),
                },
                { where: { semester, programId } },
            );
            res.status(200).json({ message: 'Demotion successful' });
        } else if (year) {
            if (year.length > 4) {
                return res.status(400).json({ error: 'Invalid year format' });
            }
            const normalizedYear = year.toString().slice(-2);

            await models.student.update(
                {
                    semester: sequelize.literal(
                        'CASE WHEN semester > 0 THEN semester - 1 ELSE 0 END',
                    ),
                },
                { where: { rollNumber: { [Op.like]: `${normalizedYear}%` } } },
            );
            return res.status(200).json({ message: 'Demotion successful' });
        } /* else if (semester) {
            if (semester <= 1) {
                return res.json({
                    error: 'Semester cannot be demoted further!',
                });
            }

            await models.student.update(
                {
                    semester: sequelize.literal(
                        'CASE WHEN semester > 0 THEN semester - 1 ELSE 0 END',
                    ),
                },
                { where: { semester } },
            );
            res.status(200).json({
                message: 'Demotion successful for all students',
            });
        }  */ else if (programId) {
            await models.student.update(
                {
                    semester: sequelize.literal(
                        'CASE WHEN semester > 0 THEN semester - 1 ELSE 0 END',
                    ),
                },
                { where: { programId } },
            );
            return res.status(200).json({
                message: 'Demotion successful for all students',
            });
        } else {
            return res
                .status(400)
                .json({ error: 'Invalid request parameters' });
        }
    } catch (error) {
        // Handle errors
        console.error('Error demoting students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/passout', async (req, res) => {
    try {
        const { semester, year, program: programId } = req.body;

        if (semester && programId) {
            await models.student.update(
                { semester: 0 },
                { where: { semester, programId } },
            );
            res.status(200).json({ message: 'Passout successful' });
        } else if (year) {
            if (year.length > 4) {
                return res.status(400).json({ error: 'Invalid year format' });
            }
            const normalizedYear = year.toString().slice(-2);

            await models.student.update(
                { semester: 0 },
                { where: { rollNumber: { [Op.like]: `${normalizedYear}%` } } },
            );
            return res.status(200).json({ message: 'Passout successful' });
        } /* else if (semester) {
            await models.student.update(
                { semester: 0 },
                { where: { semester } },
            );
            res.status(200).json({
                message: 'Passout successful for all students',
            });
        } else if (programId) {
            await models.student.update(
                { semester: 0 },
                { where: { programId } },
            );
            return res.status(200).json({
                message: 'Passout successful for all students',
            });
        } */ else {
            return res
                .status(400)
                .json({ error: 'Invalid request parameters' });
        }
    } catch (error) {
        // Handle errors
        console.error('Error marking students as passout:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
