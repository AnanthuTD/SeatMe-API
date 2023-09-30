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

export { getStaffs, getStaffCount, getStudentCount, getStudents, findStudent };
