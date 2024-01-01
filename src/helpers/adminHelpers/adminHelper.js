import { Op, literal } from 'sequelize';
import { models, sequelize } from '../../sequelize/models.js';
import { fetchExams } from '../seatAssignment/getData.js';
import { retrieveAndStoreExamsInRedis } from './studentSeat.js';
import logger from '../logger.js';

const getStaffs = async (
    query = [''],
    columns = ['id'],
    offset = 0,
    limit = 10,
    sortField = 'updatedAt',
    sortOrder = 'DESC',
) => {
    try {
        sortOrder = sortOrder.toUpperCase();

        const nestedColumns = [];
        const nestedColumnsQuery = [];
        const nonNestedColumns = [];
        const nonNestedColumnsQuery = [];

        columns.forEach((column, index) => {
            if (column.includes('.')) {
                nestedColumns.push(column);
                nestedColumnsQuery.push(query[index]);
            } else {
                nonNestedColumns.push(column);
                nonNestedColumnsQuery.push(query[index]);
            }
        });

        const isNestedSortField = sortField.includes('.');

        const whereConditionNested = {
            [Op.and]: nestedColumns.map((col, index) => ({
                [col.split('.')[1]]: {
                    [Op.like]: `${query[index]}%`,
                },
            })),
        };
        const whereCondition = {
            [Op.and]: nonNestedColumns.map((col, index) => ({
                [col]: {
                    [Op.like]:
                        col === 'programId' || col === 'semester'
                            ? query[index]
                            : `${query[index]}%`,
                },
            })),
        };

        const orderCondition = [];

        if (sortField && sortOrder) {
            const field = isNestedSortField
                ? sortField.split('.')[1]
                : sortField;

            if (sortOrder === 'ASC' || sortOrder === 'DESC') {
                if (isNestedSortField) {
                    orderCondition.push([models.department, field, sortOrder]);
                } else orderCondition.push([field, sortOrder]);
            }
        }

        const data = await models.authUser.findAll({
            limit,
            offset,
            where: nonNestedColumns.length ? whereCondition : undefined,
            order: orderCondition,
            include: [
                {
                    model: models.department,
                    attributes: [],
                    where: nestedColumns.length
                        ? whereConditionNested
                        : undefined,
                },
            ],
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'designation',
                'departmentCode',
                [sequelize.col('department.name'), 'departmentName'],
                [
                    sequelize.literal(
                        "CASE WHEN SUBSTRING(authUser.id, 3, 1) = 'A' THEN 'aided' ELSE 'unaided' END",
                    ),
                    'aided/unaided',
                ],
            ],
            raw: true,
        });

        return data;
    } catch (error) {
        // Handle the error, log it, or throw a custom error if needed
        console.error('Error in getStaffs:', error);
        throw new Error('An error occurred while fetching staff data.');
    }
};

const getStaffCount = async () => {
    const totalCount = await models.authUser.count();

    return totalCount;
};

const getStudents = async (offset, limit) => {
    const data = await models.student.findAll({
        limit,
        offset,
        order: [['id', 'ASC']],
        include: {
            model: models.program,
            attributes: ['name'],
        },
        attributes: [
            'id',
            'name',
            'email',
            'phone',
            'programId',
            'rollNumber',
            'semester',
        ],
        raw: true,
    });

    return data;
};

const getStudentCount = async () => {
    const totalCount = await models.student.count();

    return totalCount;
};

const findStudent = async (
    query = [''],
    columns = ['id'],
    offset = 0,
    limit = 10,
    sortField = 'updatedAt',
    sortOrder = 'DESC',
) => {
    try {
        sortOrder = sortOrder.toUpperCase();

        const nestedColumns = [];
        const nestedColumnsQuery = [];
        const nonNestedColumns = [];
        const nonNestedColumnsQuery = [];

        columns.forEach((column, index) => {
            if (column.includes('.')) {
                nestedColumns.push(column);
                nestedColumnsQuery.push(query[index]);
            } else {
                nonNestedColumns.push(column);
                nonNestedColumnsQuery.push(query[index]);
            }
        });

        const isNestedSortField = sortField.includes('.');

        const whereConditionNested = {
            [Op.and]: nestedColumns.map((col, index) => ({
                [col.split('.')[1]]: {
                    [Op.like]: `${query[index]}%`,
                },
            })),
        };
        const whereCondition = {
            [Op.and]: nonNestedColumns.map((col, index) => ({
                [col]: {
                    [Op.like]:
                        col === 'programId' || col === 'semester'
                            ? query[index]
                            : `${query[index]}%`,
                },
            })),
        };

        const orderCondition = [];

        if (sortField && sortOrder) {
            const field = isNestedSortField
                ? sortField.split('.')[1]
                : sortField;

            if (sortOrder === 'ASC' || sortOrder === 'DESC') {
                if (isNestedSortField) {
                    orderCondition.push([models.program, field, sortOrder]);
                } else orderCondition.push([field, sortOrder]);
            }
        }

        const data = await models.student.findAll({
            limit,
            offset,
            where: nonNestedColumns.length ? whereCondition : undefined,
            order: orderCondition,
            include: [
                {
                    model: models.program,
                    attributes: [],
                    required: true,
                    where: nestedColumns.length
                        ? whereConditionNested
                        : undefined,
                },
                {
                    model: models.course,
                    attributes: [],
                    required: false,
                    where: { type: 'open' },
                },
            ],
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'programId',
                'rollNumber',
                'semester',
                'openCourseId',
                [sequelize.col('program.is_aided'), 'isAided'],
                [sequelize.col('course.name'), 'openCourseId'],
                [sequelize.col('program.name'), 'programName'],
            ],
            raw: true,
        });

        return data;
    } catch (error) {
        // Handle the error, log it, or throw a custom error if needed
        console.error('Error in getStudents:', error);
        throw new Error('An error occurred while fetching students data.');
    }
};

const getDepartments = async () => {
    const department = await models.department.findAll();
    return department;
};
const getBlocks = async () => {
    const block = await models.block.findAll();
    return block;
};

const getPrograms = async (departmentCode) => {
    if (departmentCode) {
        const programs = await models.program.findAll({
            where: { departmentCode },
            include: {
                model: models.department,
                attributes: ['name'],
                required: true,
            },
            raw: true,
        });
        console.log('hi');
        logger('programs', programs);
        return programs;
    }
    const allPrograms = await models.program.findAll({
        include: {
            model: models.department,
            attributes: ['name'],
        },
        raw: true,
    });
    return allPrograms;
};

const getCourses = async (programId, semester) => {
    if (!programId) {
        const courses = await models.course.findAll({});
        return courses;
    }

    const program = await models.program.findByPk(programId);
    const { hasOpenCourse, isAided } = program;

    try {
        // Find the program by programId and include its associated courses
        let courses;
        if (semester) {
            const baseQuery = {
                include: [
                    {
                        model: models.programCourse,
                    },
                    {
                        model: models.program,
                        where: {
                            isAided,
                        },
                        // required: true,
                    },
                ],
                where: {
                    semester,
                    [Op.or]: [
                        {
                            '$programCourses.program_id$': {
                                [Op.ne]: programId,
                            },
                            type: 'open',
                        },
                        {
                            '$programCourses.program_id$': {
                                [Op.eq]: programId,
                            },
                            type: { [Op.ne]: 'open' },
                        },
                    ],
                },
            };

            // If hasOpenCourse is false, adjust the condition
            if (!hasOpenCourse) {
                baseQuery.where[Op.or] = [
                    {
                        '$programCourses.program_id$': {
                            [Op.eq]: programId,
                        },
                        type: { [Op.ne]: 'open' },
                    },
                ];
            }

            courses = await models.course.findAll(baseQuery);
        } else {
            const baseQuery = {
                include: [
                    {
                        model: models.programCourse,
                        where: {
                            programId: {
                                [Op.or]: [
                                    { [Op.ne]: programId },
                                    { [Op.eq]: programId },
                                ],
                            },
                        },
                    },
                    {
                        model: models.program,
                        where: {
                            isAided,
                        },
                        // required: true,
                    },
                ],
                where: {
                    [Op.or]: [
                        {
                            '$programCourses.program_id$': {
                                [Op.ne]: programId,
                            },
                            type: 'open',
                        },
                        {
                            '$programCourses.program_id$': {
                                [Op.eq]: programId,
                            },
                            type: [Op.ne, 'open'],
                        },
                    ],
                },
            };

            if (!hasOpenCourse) {
                baseQuery.where[Op.or] = [
                    {
                        '$programCourses.program_id$': {
                            [Op.eq]: programId,
                        },
                        type: { [Op.ne]: 'open' },
                    },
                ];
            }
            courses = await models.course.findAll(baseQuery);
        }

        if (!courses) {
            return [];
        }

        return courses;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
};
const getCoursesExams = async (programId, semester) => {
    if (!programId) {
        const courses = await models.course.findAll({
            include: [
                {
                    model: models.exam,
                    include: [
                        {
                            model: models.dateTime,
                            where: { date: { [Op.gte]: new Date() } },
                            required: true,
                        },
                    ],
                    required: true,
                },
            ],
        });
        return courses;
    }
    try {
        // Find the program by programId and include its associated courses
        let courses;
        if (semester) {
            courses = await models.course.findAll({
                include: [
                    {
                        model: models.programCourse,
                    },
                    {
                        model: models.exam,
                        include: [
                            {
                                model: models.dateTime,
                                where: { date: { [Op.gte]: new Date() } },
                                required: true,
                            },
                        ],
                        required: true,
                    },
                ],
                where: {
                    semester,
                    [Op.or]: [
                        {
                            '$programCourses.program_id$': {
                                [Op.ne]: programId,
                            },
                            type: 'open',
                        },
                        {
                            '$programCourses.program_id$': {
                                [Op.eq]: programId,
                            },
                            type: { [Op.ne]: 'open' },
                        },
                    ],
                },
            });
        } else {
            courses = await models.course.findAll({
                include: [
                    {
                        model: models.programCourse,
                        where: {
                            programId: {
                                [Op.or]: [
                                    { [Op.ne]: programId },
                                    { [Op.eq]: programId },
                                ],
                            },
                        },
                    },
                    {
                        model: models.exam,
                        include: [
                            {
                                model: models.dateTime,
                                where: { date: { [Op.gte]: new Date() } },
                                required: true,
                            },
                        ],
                        required: true,
                    },
                ],
                where: {
                    [Op.or]: [
                        {
                            '$programCourses.program_id$': {
                                [Op.ne]: programId,
                            },
                            type: 'open',
                        },
                        {
                            '$programCourses.program_id$': {
                                [Op.eq]: programId,
                            },
                            type: [Op.ne, 'open'],
                        },
                    ],
                },
            });
        }

        if (!courses) {
            return [];
        }

        logger(courses, 'courses');

        return courses;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
};

const setExam = async (data) => {
    try {
        const { courseId, date, timeCode } = data;
        const [dateTimeRecord] = await models.dateTime.findOrCreate({
            where: { date, timeCode },
        });

        await models.exam.upsert({
            dateTimeId: dateTimeRecord.id,
            courseId,
        });

        retrieveAndStoreExamsInRedis();

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

const getExamDateTime = async ({ courseId = undefined }) => {
    if (!courseId) return false;

    const examDateTime = await models.exam.findOne({
        where: { courseId },
        include: {
            model: models.dateTime,
            attributes: ['date', 'timeCode'],
            where: { date: { [Op.gte]: new Date() } },
            required: true,
        },
        attributes: [],
    });
    return examDateTime?.dateTime;
};

const getExams = async ({
    query = '',
    column = '',
    offset = 0,
    limit = 10,
    sortField = 'date',
    sortOrder = 'DESC',
}) => {
    try {
        sortOrder = sortOrder.toUpperCase();

        let courseWhereCondition = {};
        let dateTimesWhereCondition = {};

        console.log(column);
        if (['date', 'timeCode'].includes(column)) {
            dateTimesWhereCondition[column] = {
                [Op.like]: `${query}%`,
            };
        } else if (
            ['course.id', 'course.name', 'course.semester'].includes(column)
        ) {
            courseWhereCondition[column.split('.')[1]] = {
                [Op.like]: `${query}%`,
            };
        }

        const orderCondition = [];

        if (sortField && sortOrder) {
            if (sortOrder === 'ASC' || sortOrder === 'DESC') {
                if (['date', 'timeCode'].includes(sortField)) {
                    orderCondition.push([
                        models.dateTime,
                        sortField,
                        sortOrder,
                    ]);
                } else if (
                    ['course.id', 'course.name', 'course.semester'].includes(
                        sortField,
                    )
                )
                    orderCondition.push([
                        models.course,
                        sortField.split('.')[1],
                        sortOrder,
                    ]);
            }
        }

        console.log(orderCondition);

        const data = await models.exam.findAll({
            limit,
            offset,
            order: orderCondition,
            include: [
                {
                    model: models.dateTime,
                    attributes: [],
                    required: true,
                    where: dateTimesWhereCondition,
                },
                {
                    model: models.course,
                    required: true,
                    attributes: ['id', 'name', 'semester'],
                    where: courseWhereCondition,
                },
            ],
            attributes: [
                'id',
                [sequelize.col('dateTime.date'), 'date'],
                [sequelize.col('dateTime.time_code'), 'timeCode'],
                /* [sequelize.col('course.id'), 'courseId'],
                [sequelize.col('course.name'), 'courseName'],
                [sequelize.col('course.semester'), 'semester'], */
            ],
            raw: true,
        });
        // console.log(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        // Handle the error, log it, or throw a custom error if needed
        console.error('Error in getExams:', error);
        throw new Error('An error occurred while fetching exams data.');
    }
};

const getOngoingExamCount = async () => {
    const currentDate = new Date();
    const totalCount = await models.exam.count({
        include: [
            {
                model: models.dateTime,
                where: {
                    date: {
                        [Op.gte]: currentDate,
                    },
                },
            },
            {
                model: models.course,
            },
        ],
    });

    return totalCount;
};

const getRooms = async ({ examType = 'final', availability = undefined }) => {
    let rowsAndCols = [];
    if (examType === 'final')
        rowsAndCols = [
            ['final_rows', 'rows'],
            ['final_cols', 'cols'],
        ];
    else
        rowsAndCols = [
            ['internal_rows', 'rows'],
            ['internal_cols', 'cols'],
        ];

    try {
        const rooms = await models.room.findAll({
            attributes: [
                'id',
                ...rowsAndCols,
                'blockId',
                'isAvailable',
                'floor',
                'priority',
                [literal(`${rowsAndCols[0][0]}*${rowsAndCols[1][0]}`), 'seats'],
            ],
            where:
                availability === undefined
                    ? undefined
                    : { isAvailable: availability === 'true' },
        });
        return rooms;
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error;
    }
};

const updateRoomAvailability = async ({ roomIds = [] }) => {
    const t = await sequelize.transaction();
    try {
        // Update rooms with specific ids to isAvailable: true
        await models.room.update(
            { isAvailable: true },
            {
                where: {
                    id: roomIds,
                },
                transaction: t,
            },
        );

        // Update rooms with ids not in roomIds to isAvailable: false
        await models.room.update(
            { isAvailable: false },
            {
                where: {
                    id: {
                        [Op.notIn]: roomIds,
                    },
                },
                transaction: t,
            },
        );

        await t.commit(); // Commit the transaction
    } catch (error) {
        await t.rollback(); // Rollback the transaction
        throw error;
    }
};

const countExamsForDate = async ({
    targetDate = new Date(),
    timeCode = 'AN',
}) => {
    const { openCourses, nonOpenCourses } = await fetchExams(
        targetDate,
        timeCode,
    );
    const data = [...nonOpenCourses, ...openCourses];
    try {
        const count = await models.student.count({
            where: {
                [Op.or]: data.map((value) => ({
                    programId: value.programId,
                    semester: value.semester,
                })),
            },
        });

        return count;
    } catch (error) {
        console.error('Error counting exams:', error);
        throw error;
    }
};

const upsertStudents = async (students) => {
    const formattedStudents = students.map((student) => {
        const rollNumberStr = student.rollNumber.toString();
        const programIdDigits = rollNumberStr.slice(2, 4);
        return {
            ...student,
            programId: parseInt(programIdDigits, 10),
        };
    });

    const uncreatedStudents = [];

    try {
        await Promise.all(
            formattedStudents.map(async (student) => {
                try {
                    await models.student.upsert(student, {
                        returning: true,
                    });
                } catch (error) {
                    console.error(
                        `Error creating or updating student ${student.id}:`,
                        error,
                    );
                    uncreatedStudents.push({
                        ...student,
                        error: error.message || 'Unknown error',
                    });
                }
            }),
        );

        return { success: true, uncreatedStudents, error: null };
    } catch (error) {
        console.error('Error creating or updating students:', error);
        return { success: false, uncreatedStudents: [], error: error.message };
    }
};

const updateStudent = async (student) => {
    const [updateCount] = await models.student.update(student, {
        where: { id: student.id },
    });

    return updateCount;
};

const deleteStudent = async (studentId) => {
    try {
        const deletedStudent = await models.student.destroy({
            where: {
                id: studentId,
            },
        });

        return deletedStudent;
    } catch (error) {
        throw Error(error.message);
    }
};

const getAvailableOpenCourses = async (programId) => {
    const program = await models.program.findByPk(programId, {
        attributes: ['isAided'],
    });
    const openCourses = await models.course.findAll({
        where: { type: 'open' },
        include: {
            model: models.program,
            attributes: [],
            through: { attributes: [] },
            where: { id: { [Op.ne]: programId }, isAided: program.isAided },
            required: true,
        },
        attributes: ['id', 'name'],
    });

    return openCourses;
};

const findStudentsByProgramSem = async (programId, semester = undefined) => {
    try {
        const a = {
            include: [
                {
                    model: models.program,
                    attributes: ['name', 'isAided'],
                    required: true,
                },
                {
                    model: models.course,
                    attributes: ['name'],
                    required: false,
                    where: { type: 'open' },
                },
            ],
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'programId',
                'rollNumber',
                'semester',
                'openCourseId',
            ],
            raw: true,
        };

        let students;
        if (semester) {
            students = await models.student.findAll({
                where: { programId, semester },
                ...a,
            });
        } else
            students = await models.student.findAll({
                where: { programId },
                ...a,
            });
        return students;
    } catch (error) {
        console.error('Error querying students:', error);
        throw error;
    }
};

export {
    getStaffs,
    getStaffCount,
    getStudentCount,
    getStudents,
    findStudent,
    getDepartments,
    getBlocks,
    getCourses,
    getPrograms,
    setExam,
    getOngoingExamCount,
    getExams,
    getRooms,
    updateRoomAvailability,
    getExamDateTime,
    countExamsForDate,
    upsertStudents,
    updateStudent,
    getAvailableOpenCourses,
    deleteStudent,
    findStudentsByProgramSem,
    getCoursesExams,
};
