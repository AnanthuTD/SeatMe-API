import { CronJob } from 'cron';
import { models } from '../sequelize/models.js';
import { retrieveAndStoreSeatingInfoInRedis } from '../helpers/adminHelpers/studentSeat.js';

// An array to store references to existing jobs
let existingJobs = [];

// Function to update scheduled tasks based on seatingTimeConfig changes
const updateScheduledTasks = async () => {
    try {
        // Fetch schedule times from the seatingTimeConfig table
        const scheduleTimes = await models.seatingTimeConfig.findAll();

        // Clear existing tasks
        existingJobs.forEach((job) => {
            job.stop();
        });

        // Schedule tasks for each time configuration
        const newJobs = scheduleTimes.map((config) => {
            const { startTime, endTime, timeCode, day } = config;

            const firstThreeLettersOfDay = day.slice(0, 3);

            const [hours, minutes] = startTime.split(':');
            const cronExpression = `00 ${22} ${12} * * ${firstThreeLettersOfDay}`;
            console.log(cronExpression);

            const onTick = () => retrieveAndStoreSeatingInfoInRedis();

            const job = CronJob.from({
                cronTime: cronExpression,
                onTick,
                start: true,
                // timeZone: 'Asia/Kolkata',
            });

            return job;
        });

        console.log('Tasks updated based on seatingTimeConfig changes.');

        // Store the new jobs for future reference or clearing
        existingJobs = newJobs;
    } catch (error) {
        console.error('Error updating scheduled tasks:', error);
    }
};

export { updateScheduledTasks };
