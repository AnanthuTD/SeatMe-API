import { Op, literal } from 'sequelize';
import { models, sequelize } from '../../sequelize/models.js';
import { fetchExams } from '../seatAssignment/getData.js';

const getStaffs = async (
    query = '',
    column = 'id',
    offset = 0,
    limit = 10,
    sortField = 'updatedAt',
    sortOrder = 'DESC',
) => {
    sortOrder = sortOrder.toUpperCase();

    const isNestedColumn = column.includes('.');
    const isNestedSortField = sortField.includes('.');

    const whereCondition = {
        [isNestedColumn ? column.split('.')[1] : column]: {
            [Op.like]: `${query}%`,
        },
    };

    const orderCondition = [];

    if (sortField && sortOrder) {
        const field = isNestedSortField ? sortField.split('.')[1] : sortField;

        if (sortOrder === 'ASC' || sortOrder === 'DESC') {
            if (isNestedSortField) {
                orderCondition.push([models.department, field, sortOrder]);
            } else orderCondition.push([field, sortOrder]);
        }
    }

    const data = await models.authUser.findAll({
        limit,
        offset,
        where: whereCondition,
        order: orderCondition,
        include: {
            model: models.department,
            attributes: ['name'],
            // required: true,
            where: isNestedColumn ? whereCondition : undefined,
        },
        attributes: [
            'id',
            'name',
            'email',
            'phone',
            'designation',
            'departmentId',
            'department.name',
        ],
        raw: true,
    });

    return data;
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
    query = '',
    column = 'id',
    offset = 0,
    limit = 10,
    sortField = 'updatedAt',
    sortOrder = 'DESC',
) => {
    sortOrder = sortOrder.toUpperCase();

    const isNestedColumn = column.includes('.');
    const isNestedSortField = sortField.includes('.');

    const whereCondition = {
        [isNestedColumn ? column.split('.')[1] : column]: {
            [Op.like]: `${query}%`,
        },
    };

    const orderCondition = [];

    if (sortField && sortOrder) {
        const field = isNestedSortField ? sortField.split('.')[1] : sortField;

        if (sortOrder === 'ASC' || sortOrder === 'DESC') {
            if (isNestedSortField) {
                orderCondition.push([models.program, field, sortOrder]);
            } else orderCondition.push([field, sortOrder]);
        }
    }

    const data = await models.student.findAll({
        limit,
        offset,
        where: whereCondition,
        order: orderCondition,
        include: {
            model: models.program,
            attributes: ['name'],
            required: true,
            where: isNestedColumn ? whereCondition : undefined,
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
            program = await models.program.findByPk(programId, {
                include: [
                    {
                        model: models.course,
                        through: models.programCourse, // Use the through option to specify the join table
                        where: { semester },
                    },
                ],
            });
        } else {
            program = await models.program.findByPk(programId, {
                include: [
                    {
                        model: models.course,
                        through: models.programCourse, // Use the through option to specify the join table
                    },
                ],
            });
        }

        if (!program) {
            return [];
        }

        const { courses } = program;

        return courses;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
};

const updateCoursesDateTime = async (data) => {
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

    return true;
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
    column = 'id',
    offset = 0,
    limit = 10,
    sortField = 'name',
    sortOrder = 'ASC',
}) => {
    sortOrder = sortOrder.toUpperCase();

    const isNestedColumn = column.includes('.');
    const isNestedSortField = sortField.includes('.');

    const whereCondition = {
        [isNestedColumn ? column.split('.')[1] : column]: {
            [Op.like]: `${query}%`,
        },
    };

    const orderCondition = [];

    if (sortField && sortOrder) {
        const field = isNestedSortField ? sortField.split('.')[1] : sortField;

        if (sortOrder === 'ASC' || sortOrder === 'DESC') {
            if (isNestedSortField) {
                orderCondition.push([models.dateTime, field, sortOrder]);
            } else orderCondition.push([field, sortOrder]);
        }
    }

    const data = await models.course.findAll({
        limit,
        offset,
        where: whereCondition,
        order: orderCondition,
        include: {
            model: models.dateTime,
            through: { attributes: [] },
            attributes: ['date', 'timeCode'],
            required: true,
            where: isNestedColumn ? whereCondition : undefined,
        },
        raw: true,
    });

    return data;
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

const getRooms = async () => {
    try {
        const rooms = await models.room.findAll({
            attributes: [
                'id',
                'rows',
                'cols',
                'blockId',
                'isAvailable',
                'floor',
                [literal('`rows` * `cols`'), 'seats'],
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
    const data = await fetchExams(targetDate);
    try {
        const count = await models.student.count({
            where: {
                [Op.or]: data.flatMap((dateTime) =>
                    dateTime.courses.flatMap((course) =>
                        course.programs.map((program) => ({
                            programId: program.id,
                            semester: course.semester,
                        })),
                    ),
                ),
            },
        });

        return count;
    } catch (error) {
        console.error('Error counting exams:', error);
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
    updateCoursesDateTime,
    getOngoingExamCount,
    getExams,
    getRooms,
    updateRoomAvailability,
    getExamDateTime,
    countExamsForDate,
};
