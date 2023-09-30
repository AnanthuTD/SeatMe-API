import { Op } from 'sequelize';
import { models } from '../../sequelize/models.js';

const getStaffs = async (offset, limit) => {
    const data = await models.authUser.findAll({
        limit,
        offset,
        order: [['id', 'ASC']],
        attributes: [
            'id',
            'name',
            'email',
            'phone',
            'designation',
            'departmentId',
        ],
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

const findStudent = async (query, column, offset, limit) => {
    const whereCondition = {};
    whereCondition[column] = {
        [Op.like]: `${query}%`,
    };

    const data = await models.student.findAll({
        where: whereCondition,
        order: [['id', 'ASC']],
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

export { getStaffs, getStaffCount, getStudentCount, getStudents, findStudent };
