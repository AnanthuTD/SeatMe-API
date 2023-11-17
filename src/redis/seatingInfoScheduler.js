import { CronJob } from 'cron';
import { models } from '../sequelize/models.js';
import {
    clearSeatingInfoFromRedis,
    retrieveAndStoreSeatingInfoInRedis,
} from '../helpers/adminHelpers/studentSeat.js';

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
        const newJobs = scheduleTimes
            .map((config) => {
                const { startTime, endTime, day } = config;

                const firstThreeLettersOfDay = day.slice(0, 3);

                let hours;
                let minutes;

                [hours, minutes] = startTime.split(':');
                const retrievalCronTime = `00 ${minutes} ${hours} * * ${firstThreeLettersOfDay}`;

                const job1 = CronJob.from({
                    cronTime: retrievalCronTime,
                    onTick: retrieveAndStoreSeatingInfoInRedis,
                    start: true,
                    timeZone: 'Asia/Kolkata',
                });

                [hours, minutes] = endTime.split(':');
                const clearingCronTime = `00 ${minutes} ${hours} * * ${firstThreeLettersOfDay}`;

                const job2 = CronJob.from({
                    cronTime: clearingCronTime,
                    onTick: clearSeatingInfoFromRedis,
                    start: true,
                    timeZone: 'Asia/Kolkata',
                });

                return [job1, job2];
            })
            .flat();

        console.log('Tasks updated based on seatingTimeConfig changes.');

        // Store the new jobs for future reference or clearing
        existingJobs = newJobs;
    } catch (error) {
        console.error('Error updating scheduled tasks:', error);
    }
};

export { updateScheduledTasks };
