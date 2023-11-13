import { Op, literal } from 'sequelize';
import { models, sequelize } from '../../sequelize/models.js';
import { fetchExams } from '../seatAssignment/getData.js';
import { retrieveAndStoreExamsInRedis } from './studentSeat.js';

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
                'departmentId',
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
                    where: { isOpenCourse: true },
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

const getPrograms = async (departmentId) => {
    if (departmentId) {
        const programs = await models.program.findAll({
            where: { departmentId },
        });
        return programs;
    }
    const allPrograms = await models.program.findAll();
    return allPrograms;
};

const getCourses = async (programId, semester) => {
    if (!programId) {
        const courses = await models.course.findAll({});
        return courses;
    }
    try {
        // Find the program by programId and include its associated courses
        let program;
        if (semester) {
            program = await models.course.findAll({
                include: {
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
                where: {
                    semester,
                    [Op.or]: [
                        {
                            '$programCourses.program_id$': {
                                [Op.ne]: programId,
                            },
                            isOpenCourse: 1,
                        },
                        {
                            '$programCourses.program_id$': {
                                [Op.eq]: programId,
                            },
                            isOpenCourse: 0,
                        },
                    ],
                },
            });
        } else {
            program = await models.course.findAll({
                include: {
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
                where: {
                    [Op.or]: [
                        {
                            '$programCourses.program_id$': {
                                [Op.ne]: programId,
                            },
                            isOpenCourse: 1,
                        },
                        {
                            '$programCourses.program_id$': {
                                [Op.eq]: programId,
                            },
                            isOpenCourse: 0,
                        },
                    ],
                },
            });
        }

        // console.log('program', JSON.stringify(program, null, 2));
        if (!program) {
            return [];
        }
        // getAvailableOpenCourses(programId, program.isAided);

        // const { courses } = program;

        return program;
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

        const courseExist = await models.course.findByPk(courseId);
        if (!courseExist) return false;

        const existingExam = await models.exam.findOne({
            where: {
                courseId,
            },
            include: [
                {
                    model: models.dateTime,
                    attributes: ['date'],
                    where: { date: { [Op.gt]: new Date() } },
                    require: true,
                },
            ],
        });

        if (existingExam) {
            // If an existing exam with a future date is found, update its dateTimeId
            await existingExam.update({ dateTimeId: dateTimeRecord.id });
        } else {
            await models.exam.create({
                dateTimeId: dateTimeRecord.id,
                courseId,
            });
        }

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

const getRooms = async ({ examType = 'final' }) => {
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
                [literal(`${rowsAndCols[0][0]}*${rowsAndCols[1][0]}`), 'seats'],
            ],
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

const countExamsForDate = async ({ targetDate = new Date() }) => {
    const { openCourses, nonOpenCourses } = await fetchExams(targetDate);
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

const findOrCreateStudents = async (students) => {
    try {
        const foundOrCreatedStudents = await Promise.all(
            students.map(async (student) => {
                const [foundStudent, created] =
                    await models.student.findOrCreate({
                        where: {
                            id: student.id,
                        },
                        defaults: student,
                    });

                return { foundStudent, created, student };
            }),
        );

        const existingStudent = foundOrCreatedStudents.filter(
            (studentInfo) => studentInfo.created === false,
        );

        // console.log(JSON.stringify(existingStudent, null, 2));

        return existingStudent;
    } catch (error) {
        console.error('Error finding or creating students:', error);
        return false;
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
        where: { isOpenCourse: 1 },
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
                    where: { isOpenCourse: true },
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
    getCourses,
    getPrograms,
    setExam,
    getOngoingExamCount,
    getExams,
    getRooms,
    updateRoomAvailability,
    getExamDateTime,
    countExamsForDate,
    findOrCreateStudents,
    updateStudent,
    getAvailableOpenCourses,
    deleteStudent,
    findStudentsByProgramSem,
};
