import dayjs from 'dayjs';
import { models, sequelize } from '../../sequelize/models.js';
import logger from '../logger.js';
import { Op } from 'sequelize';

const getDateTimeId = async (date, timeCode = 'AN') => {
    const dateTimeId = await models.dateTime.findOne({
        where: { date, timeCode },
        attributes: ['id'],
        raw: true,
    });

    return dateTimeId;
};

const getExamsByProgram = async ({ date, timeCode }) => {
    console.log('getExamsByProgram', date, timeCode);
    try {
        const data = await models.exam.findAll({
            include: [
                {
                    model: models.dateTime,
                    attributes: [],
                    where: { date: { [Op.like]: date }, timeCode },
                    required: true,
                },
                {
                    model: models.course,
                    include: [
                        {
                            model: models.program,
                            through: {
                                model: models.programCourse,
                                attributes: [],
                            },
                            attributes: [],
                        },
                    ],
                    attributes: [],
                },
            ],
            attributes: [
                'id',
                [sequelize.col('course.programs.abbreviation'), 'program'],
                [sequelize.col('course.name'), 'courseName'],
                [sequelize.col('course.id'), 'courseId'],
            ],
            raw: true,
        });
        logger.debug(data, 'exams by program');
        return data;
    } catch (error) {
        // Handle the error, log it, or throw a custom error if needed
        logger.error(error, 'Error in getExamsByProgram:');
        throw new Error('An error occurred while fetching exams data.');
    }
};

export { getDateTimeId, getExamsByProgram };
