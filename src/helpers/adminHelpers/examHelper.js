import { models } from '../../sequelize/models.js';

const getDateTimeId = async (date, timeCode = 'AN') => {
    const dateTimeId = await models.dateTime.findOne({
        where: { date, timeCode },
        attributes: ['id'],
        raw: true,
    });

    return dateTimeId;
};

export { getDateTimeId };
