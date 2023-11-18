import { CronJob } from 'cron';
import { models } from '../sequelize/models.js';
import {
    clearSeatingInfoFromRedis,
    retrieveAndStoreSeatingInfoInRedis,
} from '../helpers/adminHelpers/studentSeat.js';

const TIME_ZONE = 'Asia/Kolkata';

// Function to create a cron job
const createCronJob = (cronTime, onTick) => {
    return CronJob.from({
        cronTime,
        onTick,
        start: true,
        timeZone: TIME_ZONE,
    });
};

// Initialize existingJobs array
let existingJobs = [];

// Function to update scheduled tasks based on seatingTimeConfig changes
const updateScheduledTasks = async () => {
    try {
        const scheduleTimes = await models.seatingTimeConfig.findAll();

        // Clear existing jobs
        existingJobs.forEach((job) => job.stop());

        // Create new jobs
        const newJobs = scheduleTimes
            .flatMap((config) => {
                const { startTime, endTime, day } = config;
                const firstThreeLettersOfDay = day.slice(0, 3);

                let hours;
                let minutes;

                [hours, minutes] = startTime.split(':');
                const retrievalCronTime = `00 ${minutes} ${hours} * * ${firstThreeLettersOfDay}`;

                [hours, minutes] = endTime.split(':');
                const clearingCronTime = `00 ${minutes} ${hours} * * ${firstThreeLettersOfDay}`;

                const retrievalJob = createCronJob(
                    retrievalCronTime,
                    retrieveAndStoreSeatingInfoInRedis,
                );
                const clearingJob = createCronJob(
                    clearingCronTime,
                    clearSeatingInfoFromRedis,
                );

                return [retrievalJob, clearingJob];
            })
            .flat();

        console.log(
            `Successfully updated ${newJobs.length} scheduled tasks based on seatingTimeConfig changes.`,
        );
        existingJobs = newJobs; // Store new jobs for future reference
    } catch (error) {
        console.error('Error updating scheduled tasks:', error);
        // Log more details about the error, if possible
    }
};

export default updateScheduledTasks;
