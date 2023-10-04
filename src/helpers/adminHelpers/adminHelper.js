import { Op } from 'sequelize';
import { models } from '../../sequelize/models.js';

const getStaffs = async (
    query = '',
    column = 'id',
    offset = 0,
    limit = 10,
    sortField = 'updatedAt',
    sortOrder = 'DESC',
) => {
    sortOrder = sortOrder.toUpperCase();

    const whereCondition = {};

    whereCondition[column] = {
        [Op.like]: `${query}%`,
    };

    const orderCondition = [];

    if (sortField && sortOrder) {
        if (sortOrder === 'ASC') {
            orderCondition.push([sortField, 'ASC']);
        } else if (sortOrder === 'DESC') {
            orderCondition.push([sortField, 'DESC']);
        }
    }

    const data = await models.authUser.findAll({
        where: whereCondition,
        order: orderCondition,
        limit,
        offset,
        include: {
            model: models.department,
            attributes: ['name'],
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

    const whereCondition = {};

    whereCondition[column] = {
        [Op.like]: `${query}%`,
    };

    const orderCondition = [];

    if (sortField && sortOrder) {
        if (sortOrder === 'ASC') {
            orderCondition.push([sortField, 'ASC']);
        } else if (sortOrder === 'DESC') {
            orderCondition.push([sortField, 'DESC']);
        }
    }

    const data = await models.student.findAll({
        where: whereCondition,
        order: orderCondition,
        limit,
        offset,
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
        const courses = await models.course.findAll();
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
            console.log('Program not found');
            return [];
        }

        // Access the associated courses
        const { courses } = program; // Assuming you've defined the alias as "Courses"

        // Now "courses" contains an array of Course instances related to the program
        console.log('Courses related to the program:');
        courses.forEach((course) => {
            console.log(`Course Id: ${course.id}, Course Name: ${course.name}`);
        });
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

    await models.course.update(
        {
            dateTimeId: dateTimeRecord.id,
        },
        {
            where: { id: courseId },
        },
    );

    return true;
};

const getExams = async ({
    query = '',
    column = 'id',
    offset = 0,
    limit = 10,
    sortField = 'name',
    sortOrder = 'ASC',
}) => {
    // console.log('sort order: ', sortOrder);
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

        console.log('field: ', isNestedColumn);
        // console.log('sort order: ', sortOrder);

        if (sortOrder === 'ASC' || sortOrder === 'DESC') {
            if (isNestedSortField) {
                orderCondition.push([models.dateTime, field, sortOrder]);
                console.log('orderCondition: ', orderCondition);
            } else orderCondition.push([field, sortOrder]);
        }
    }

    console.log('whereCondition: ', whereCondition);

    const data = await models.course.findAll({
        limit,
        offset,
        where: whereCondition,
        order: orderCondition,
        include: {
            model: models.dateTime,
            attributes: ['date', 'timeCode'],
            required: true,
            where: isNestedColumn ? whereCondition : undefined,
        },
        raw: true,
    });

    return data;
};

const getExamCount = async () => {
    const totalCount = await models.course.count({
        where: { dateTimeId: { [Op.ne]: null } },
    });

    return totalCount;
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
    getExamCount,
    getExams,
};
