import { Op } from 'sequelize';
import { models, sequelize } from '../../sequelize/models.js';
import redisClient from '../../redis/config.js';
import logger from '../logger.js';
import keyNames from '../../redis/keyNames.js';
import dayjs from '../dayjs.js';

const findMatchingConfig = (currentTime, seatingTimes) => {
    return seatingTimes.find((config) => {
        const configStartTime = dayjs.tz(`1970-01-01T${config.startTime}`);
        const configEndTime = dayjs.tz(`1970-01-01T${config.endTime}`);

        logger.trace('Current Time:', currentTime.format());
        logger.trace('Config Start Time:', configStartTime.format());
        logger.trace('Config End Time:', configEndTime.format());

        const isAfterStartTime =
            currentTime.hour() > configStartTime.hour() ||
            (currentTime.hour() === configStartTime.hour() &&
                currentTime.minute() >= configStartTime.minute());

        const isBeforeEndTime =
            currentTime.hour() < configEndTime.hour() ||
            (currentTime.hour() === configEndTime.hour() &&
                currentTime.minute() < configEndTime.minute());

        logger.trace(isAfterStartTime, isBeforeEndTime);

        // Check if the current time is within the range of config.startTime and config.endTime
        return isAfterStartTime && isBeforeEndTime;
    });
};

const getTimeCodeForNow = async (seatingTimes) => {
    try {
        const currentTime = dayjs.tz();

        // Ensure logger is defined and functioning correctly
        logger.trace(seatingTimes, 'seating times');

        const matchingConfig = findMatchingConfig(currentTime, seatingTimes);

        return matchingConfig ? matchingConfig.timeCode : null;
    } catch (error) {
        // Add proper error handling
        logger.error(error, 'Error in getTimeCodeForNow');
        return null;
    }
};

const clearSeatingInfoFromRedis = async () => {
    try {
        redisClient.del(keyNames.seatingInfo);
    } catch (error) {
        logger.error(error, 'Failed to clear seating info from redis!');
    }
};

const retrieveAndStoreSeatingInfoInRedis = async () => {
    logger.trace('retrieving and storing seating info to redis');
    try {
        const currentDate = new dayjs.tz();
        const currentDayOfWeek = currentDate.day();

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

        const seatingTimes = await models.seatingTimeConfig.findAll({
            where: { day },
        });

        const timeCode = await getTimeCodeForNow(seatingTimes);

        if (!timeCode)
            return logger.warn(
                'No info available to store currently into redis.',
            );

        const seatingData = await models.studentSeat.findAll({
            attributes: [
                'id',
                'seatNumber',
                'examId',
                'roomId',
                [sequelize.col('room.floor'), 'floor'],
                [sequelize.col('room.block.id'), 'blockId'],
                [sequelize.col('room.description'), 'roomName'],
                [sequelize.col('exam.course.id'), 'courseId'],
                [sequelize.col('exam.course.name'), 'courseName'],
                [sequelize.col('exam.dateTime.time_code'), 'timeCode'],
            ],
            include: [
                {
                    model: models.exam,
                    attributes: [],
                    required: true,
                    include: [
                        {
                            model: models.dateTime,
                            where: { date: { [Op.eq]: currentDate }, timeCode },
                            required: true,
                            attributes: [],
                        },
                        {
                            model: models.course,
                            required: true,
                            attributes: ['name', 'id'],
                        },
                    ],
                },
                {
                    model: models.student,
                    attributes: [
                        'id',
                        'name',
                        'rollNumber',
                        'programId',
                        'semester',
                        'openCourseId',
                    ],
                },
                {
                    model: models.room,
                    include: [
                        {
                            model: models.block,
                            attributes: [],
                        },
                    ],
                    attributes: [],
                },
            ],
        });

        logger.trace('length of seatingData: ', seatingData.length);

        await redisClient.del(keyNames.seatingInfo);

        // Store the entire seating information in Redis
        await Promise.all(
            seatingData.map(async (record) => {
                const key = `${record.student.id}:${record.student.rollNumber}`;
                await redisClient.hset(
                    keyNames.seatingInfo,
                    key,
                    JSON.stringify(record),
                );
            }),
        );

        logger.trace('Seating information stored in Redis successfully');
    } catch (error) {
        logger.error(
            'Error retrieving or storing seating information in (retrieveAndStoreSeatingInfoInRedis)\n',
            error,
        );
    }
    return null;
};

async function scanHashAsync(key, pattern, cursor = '0', keys = []) {
    const [nextCursor, newKeys] = await redisClient.hscan(
        key,
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        '1000', // Adjust the COUNT parameter
    );
    keys.push(...newKeys);
    if (nextCursor === '0') {
        return keys;
    }
    return scanHashAsync(key, pattern, nextCursor, keys);
}

async function retrieveStudentDetails(studentId) {
    try {
        // Validate studentId format
        if (!/^\d{6}$|^\d{12}$/.test(studentId)) {
            logger.debug(
                'Invalid studentId provided. It must be either 12 or 6 digits long.',
            );
            return null;
        }

        let keys;

        // Construct Redis query based on studentId length
        if (studentId.length === 12) {
            keys = await scanHashAsync(keyNames.seatingInfo, `${studentId}:*`);
        } else {
            keys = await scanHashAsync(keyNames.seatingInfo, `*:${studentId}`);
        }

        // Check if keys were found
        if (!keys || keys.length < 2) {
            logger.error(
                'No student details found for the provided studentId.',
            );
            return null;
        }

        // Parse studentDetails from JSON
        const studentDetails = JSON.parse(keys[1]);

        return studentDetails;
    } catch (error) {
        // Log error
        logger.error('Error retrieving student details from Redis:', error);
        return null;
    }
}

const generateRecords = (seating) => {
    const records = [];

    seating.forEach((room) => {
        const { id, seatingMatrix } = room;
        const numRows = seatingMatrix.length;
        const numCols = seatingMatrix[0].length;

        for (let row = 0; row < numRows; row += 1) {
            for (let col = 0; col < numCols; col += 1) {
                if (seatingMatrix[row][col].occupied) {
                    const serialNumber = row * numCols + col + 1;
                    const { examId } = seatingMatrix[row][col];
                    const studentId = seatingMatrix[row][col].id;

                    const record = {
                        seatNumber: serialNumber,
                        roomId: id,
                        studentId,
                        examId,
                    };

                    records.push(record);
                }
            }
        }
    });

    return records;
};

const createRecord = async (seating) => {
    const records = generateRecords(seating);

    try {
        await models.studentSeat.bulkCreate(records, {
            updateOnDuplicate: ['seatNumber', 'roomId'],
        });

        // retrieve and store data into redis
        retrieveAndStoreSeatingInfoInRedis();
    } catch (error) {
        logger.error(
            error,
            'Error during bulk insert or update of studentSeat:',
        );
    }
};

async function removeAllSetsWithPattern(pattern) {
    const keysToDelete = await redisClient.keys(`${pattern}*`);

    if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
        logger.trace('Sets removed:', keysToDelete);
    } else {
        logger.trace('No sets found with the specified pattern.');
    }
}

const getUpcomingExamsById = async (studentId) => {
    const student = await models.student.findByPk(studentId, {});
    const currentDate = new dayjs.tz();

    let data = await models.course.findAll({
        attributes: [
            ['id', 'courseId'],
            ['name', 'courseName'],
            'semester',
            'type',
            [sequelize.col('exams.date_time_id'), 'dateTimeId'],
            [sequelize.col('exams.dateTime.date'), 'date'],
            [sequelize.col('exams.dateTime.time_code'), 'timeCode'],
            [sequelize.col('programCourses.program_id'), 'programId'],
        ],

        where: {
            semester: student.semester,
            [Op.or]: [
                {
                    id: {
                        [Op.eq]: student.openCourseId,
                    },
                },
                {
                    '$programCourses.program_id$': {
                        [Op.eq]: student.programId,
                    },
                    type: [Op.ne, 'open'],
                },
            ],
        },
        include: [
            {
                model: models.programCourse,
                where: {
                    programId: {
                        [Op.or]: [
                            { [Op.ne]: student.programId },
                            { [Op.eq]: student.programId },
                        ],
                    },
                },
                attributes: [],
            },
            {
                model: models.exam,
                attributes: [],
                include: [
                    {
                        model: models.dateTime,
                        attributes: [],
                        where: { date: { [Op.gte]: currentDate } },
                        required: true,
                    },
                ],
                required: true,
            },
        ],
        raw: true,
    });

    return data;
};

const getUpcomingExamsFromDB = async () => {
    const currentDate = new dayjs.tz();

    try {
        const upcomingExams = await models.course.findAll({
            attributes: [
                ['id', 'courseId'],
                ['name', 'courseName'],
                'semester',
                [sequelize.col('exams.dateTime.date'), 'date'],
                [sequelize.col('exams.dateTime.time_code'), 'timeCode'],
                [sequelize.col('exams.dateTime.id'), 'dateTimeId'],
                [sequelize.col('exams.id'), 'examId'],
                [sequelize.col('`programCourses.program_id'), 'programId'],
            ],
            include: [
                {
                    model: models.exam,
                    include: [
                        {
                            model: models.dateTime,
                            where: { date: { [Op.gte]: currentDate } },
                        },
                    ],
                    required: true,
                },
                {
                    model: models.programCourse,
                    attributes: ['programId'],
                    required: true,
                },
            ],
            raw: true,
        });

        return upcomingExams;
    } catch (error) {
        logger.error(error, 'Something went wrong!');
        return [];
    }
};

const retrieveAndStoreExamsInRedis = async () => {
    const upcomingExams = await getUpcomingExamsFromDB();

    await removeAllSetsWithPattern(keyNames.coursesProgram);
    redisClient.del(keyNames.examOpenCourses);

    upcomingExams.map(async (exam) => {
        if (exam.type === 'open') {
            const key = `${exam.courseId}-${exam.semester}`;
            redisClient.hset(
                keyNames.examOpenCourses,
                key,
                JSON.stringify(exam),
            );
        } else {
            const key = `${keyNames.coursesProgram}:${exam.programId}:${exam.semester}`;
            redisClient.sadd(key, JSON.stringify(exam));
        }
    });
};

const getUpcomingExams = async (
    programId,
    semester,
    openCourseId = undefined,
) => {
    try {
        logger.trace(programId, semester, openCourseId);
        let key = `${keyNames.coursesProgram}:${programId}:${semester}`;
        const members = await redisClient.smembers(key);
        const examDataNormal = members.map((member) => JSON.parse(member));
        logger.trace('Retrieved normal exam data:', examDataNormal);

        const combinedResults = [...examDataNormal];

        if (openCourseId) {
            key = `${openCourseId}-${semester}`;

            const examOpenCourseData = await redisClient.hget(
                keyNames.examOpenCourses,
                key,
            );

            if (examOpenCourseData) {
                const parsedExam = JSON.parse(examOpenCourseData);
                logger.trace(
                    'Retrieved exam data for open course:',
                    parsedExam,
                );
                combinedResults.push(parsedExam);
            } else {
                logger.trace(`No data found for key: ${key}`);
            }
        }

        return combinedResults;
    } catch (err) {
        logger.error(err, 'Error retrieving exam data:');
        throw err; // Re-throw the error to handle it at a higher level if needed.
    }
};

// getUpcomingExams(1, 6, 'OC1CDE001');

const getTimeTableAndSeating = async (studentId) => {
    const student = await models.student.findByPk(studentId, {});
    let data = await models.course.findAll({
        attributes: ['id', 'name'],

        where: {
            semester: student.semester,
            [Op.or]: [
                {
                    '$programCourses.program_id$': {
                        [Op.ne]: student.programId,
                    },
                    type: 'open',
                },
                {
                    '$programCourses.program_id$': {
                        [Op.eq]: student.programId,
                    },
                    type: [Op.ne, 'open'],
                },
            ],
        },
        include: [
            {
                model: models.programCourse,
                where: {
                    programId: {
                        [Op.or]: [
                            { [Op.ne]: student.programId },
                            { [Op.eq]: student.programId },
                        ],
                    },
                },
            },
            {
                model: models.exam,
                attributes: ['dateTimeId', 'id'],
                include: [
                    {
                        model: models.dateTime,
                        attributes: ['date', 'timeCode'],
                        order: [['date', 'DESC']], // Order dateTime in descending order
                    },
                    {
                        model: models.studentSeat,
                        where: { studentId },
                        include: {
                            model: models.room,
                            attributes: ['id', 'floor', 'blockId'],
                        },
                        required: false,
                    },
                ],
                required: false,
            },
        ],
        // Order courses if needed
        order: [
            [models.exam, models.dateTime, 'date', 'DESC'], // Order courses by dateTime date in descending order
        ],
    });

    data = data.map((value) => {
        if (value.exams.length > 1) {
            value.exams.splice(1);
        }
        return value;
    });

    return data;
};

export {
    createRecord,
    getTimeTableAndSeating,
    retrieveAndStoreSeatingInfoInRedis,
    retrieveStudentDetails,
    retrieveAndStoreExamsInRedis,
    getUpcomingExams,
    getUpcomingExamsFromDB,
    clearSeatingInfoFromRedis,
};
