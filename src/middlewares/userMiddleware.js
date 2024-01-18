import redisClient from '../redis/config.js';
import keyNames from '../redis/keyNames.js';
import dayjs from '../helpers/dayjs.js';

dayjs.tz.setDefault('Asia/Kolkata');

const checkSameStudent = (req, res, next) => {
    try {
        const { studentId } = req.query;

        const existingStudentId = req.cookies.studentId;
        if (existingStudentId && existingStudentId !== studentId) {
            res.clearCookie('studentId');
            res.clearCookie('programId');
            res.clearCookie('semester');
            res.clearCookie('openCourse');
        }

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required.' });
        }

        res.cookie('studentId', studentId);

        return next();
    } catch (error) {
        console.error(
            'An error occurred in userMiddleware (checkSameStudent)\n',
            error,
        );
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const checkSeatingAvailability = async (req, res, next) => {
    const { studentId } = req.query;
    res.cookie('studentId', studentId);

    const currentDayOfWeek = new dayjs().day();

    const daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];

    const day = daysOfWeek[currentDayOfWeek];

    // Retrieve seating arrangement times from Redis
    const seatingConfigList = await redisClient.hget(
        keyNames.seatingAvailabilityTimes,
        day,
    );

    if (!seatingConfigList) {
        return res.status(403).json({
            error: 'Seating arrangement time not configured for this day.',
        });
    }

    const seatingConfigurations = JSON.parse(seatingConfigList);
    const currentTime = new dayjs();

    // Check if the current time is within any of the configured ranges
    const matchingConfig = seatingConfigurations.find((config) => {
        const configStartTime = new dayjs(`1970-01-01T${config.startTime}`);
        const configEndTime = new dayjs(`1970-01-01T${config.endTime}`);

        console.log('Current Time:', currentTime.format());
        console.log('Config Start Time:', configStartTime.format());
        console.log('Config End Time:', configEndTime.format());

        const isAfterStartTime =
            currentTime.hour() > configStartTime.hour() ||
            (currentTime.hour() === configStartTime.hour() &&
                currentTime.minute() >= configStartTime.minute());

        const isBeforeEndTime =
            currentTime.hour() < configEndTime.hour() ||
            (currentTime.hour() === configEndTime.hour() &&
                currentTime.minute() < configEndTime.minute());

        console.log(isAfterStartTime, isBeforeEndTime);

        // Check if the current time is within the range of config.startTime and config.endTime
        return isAfterStartTime && isBeforeEndTime;
    });

    if (matchingConfig) {
        req.timeCode = matchingConfig.timeCode;
        return next();
    }
    return res.status(403).json({
        error: 'Seating arrangement not available at this time.',
    });
};

export { checkSameStudent, checkSeatingAvailability };
