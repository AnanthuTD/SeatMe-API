import { Op } from 'sequelize';
import { models } from '../../sequelize/models.js';
import logger from '../logger.js';

const findSupplementaryStudents = async (
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

        let data = await models.student.findAll({
            limit,
            offset,
            where:
                nonNestedColumns.length && columns[0] !== 'courses'
                    ? whereCondition
                    : undefined,
            order: orderCondition,
            include: [
                {
                    model: models.program,
                    attributes: ['name'],
                    required: true,
                    where:
                        nestedColumns.length && columns[0] !== 'courses'
                            ? whereConditionNested
                            : undefined,
                },
                {
                    model: models.course,
                    attributes: [],
                    required: false,
                    where: { type: 'open' },
                },
                {
                    model: models.supplementary,
                    attributes: ['courseId'],
                    where:
                        columns[0] === 'courses'
                            ? { courseId: query }
                            : undefined,
                    required: true,
                },
            ],
        });

        data = data.map((d) => {
            const courses = d.supplementaries.map((c) => c.courseId);
            d = d.toJSON();
            return { courses, ...d, supplementaries: null };
        });

        return data;
    } catch (error) {
        console.error('Error in getStudents:', error);
        throw new Error(
            'An error occurred while fetching supplementary students data.',
        );
    }
};

const deleteSupplement = async (record) => {
    console.log(record);
    const deleteCount = await models.supplementary.destroy({
        where: {
            [Op.and]: {
                student_id: record.id,
                courseId: { [Op.notIn]: record.courses },
            },
        },
    });

    return deleteCount;
};

export { findSupplementaryStudents, deleteSupplement };
