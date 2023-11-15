import { models } from '../sequelize/models.js';
import redisClient from './config.js';

const loadSeatingAvailabilityTimesToRedis = async () => {
    const configs = await models.seatingTimeConfig.findAll();

    // Group configurations by day
    const groupedConfigs = configs.reduce((acc, config) => {
        const { day } = config;

        if (!acc[day]) {
            acc[day] = [];
        }

        acc[day].push({
            startTime: config.startTime,
            endTime: config.endTime,
            timeCode: config.timeCode,
        });

        return acc;
    }, {});

    // Use Promise.all to parallelize Redis insertions
    const redisInsertions = Object.entries(groupedConfigs).map(
        async ([day, configurations]) => {
            await redisClient.hset(
                'seating_availability_times',
                day,
                JSON.stringify(configurations),
            );
        },
    );

    await Promise.all(redisInsertions);
};

export { loadSeatingAvailabilityTimesToRedis };
