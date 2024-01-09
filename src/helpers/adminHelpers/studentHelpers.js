import { Op } from 'sequelize';
import { models } from '../../sequelize/models.js';
import logger from '../logger.js';

const findSupplementaryStudents = async ({ date, courseIds }) => {
    try {
        const students = await models.student.findAll({
            include: [
                {
                    model: models.supplementary,
                    include: [
                        {
                            model: models.exam,
                            where: {
                                courseId: courseIds,
                            },
                            include: [
                                {
                                    model: models.dateTime,
                                    where: {
                                        date,
                                    },
                                    required: true,
                                    attributes: [],
                                },
                            ],
                            attributes: [],
                            required: true,
                        },
                    ],
                    required: true,
                    attributes: ['id'],
                },
                {
                    model: models.program,
                    attributes: ['name'],
                },
            ],
        });

        return students;
    } catch (error) {
        console.error('Error in getStudents:', error);
        throw new Error(
            'An error occurred while fetching supplementary students data.',
        );
    }
};

const deleteSupplement = async (studentId, examIds) => {
    const deleteCount = await models.supplementary.destroy({
        where: {
            [Op.and]: {
                student_id: studentId,
                examId: { [Op.notIn]: examIds },
            },
        },
    });

    return deleteCount;
};

const deleteAllSupply = async (studentId) => {
    try {
        const deletedStudent = await models.supplementary.destroy({
            where: {
                studentId,
            },
        });

        return deletedStudent;
    } catch (error) {
        throw Error(error.message);
    }
};

export { findSupplementaryStudents, deleteSupplement, deleteAllSupply };
