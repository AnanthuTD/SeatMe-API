import redisClient from '../redis/config.js';

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

    const currentDayOfWeek = new Date().getDay();

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
        'seating_availability_times',
        day,
    );

    if (!seatingConfigList) {
        return res.status(403).json({
            error: 'Seating arrangement time not configured for this day.',
        });
    }

    const seatingConfigurations = JSON.parse(seatingConfigList);
    const currentTime = new Date();

    // Check if the current time is within any of the configured ranges
    const matchingConfig = seatingConfigurations.find((config) => {
        const configStartTime = new Date(`1970-01-01T${config.startTime}`);
        const configEndTime = new Date(`1970-01-01T${config.endTime}`);

        const isAfterStartTime =
            currentTime.getHours() > configStartTime.getHours() ||
            (currentTime.getHours() === configStartTime.getHours() &&
                currentTime.getMinutes() >= configStartTime.getMinutes());

        const isBeforeEndTime =
            currentTime.getHours() < configEndTime.getHours() ||
            (currentTime.getHours() === configEndTime.getHours() &&
                currentTime.getMinutes() < configEndTime.getMinutes());

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
