import fs from 'fs';
import path from 'path';
import express from 'express';
import dayjs from 'dayjs';
import {
    getDepartments,
    getBlocks,
    getPrograms,
    getCourses,
    getRooms,
    updateRoomAvailability,
    getAvailableOpenCourses,
    countExamineesByProgramForDate,
    getExamDateTime,
    getCoursesExams,
} from '../../helpers/adminHelpers/adminHelper.js';
import getRootDir from '../../../getRootDir.js';
import staffRouter from './staffRouter.js';
import studentRouter from './studentRouter.js';
import examRouter from './examRouter.js';
import configRouter from './configRouter.js';
import courseRouter from './courseRouter.js';
import { getDateTimeId } from '../../helpers/adminHelpers/examHelper.js';
import { models } from '../../sequelize/models.js';
import {
    checkCredentialsAndRetrieveData,
    authorizeAdmin,
} from '../../helpers/commonHelper.js';
import { encrypt } from '../../helpers/bcryptHelper.js';
import { setNewRefreshToken } from '../../helpers/tokenHelpers/index.js';
import logger from '../../helpers/logger.js';
import blockRouter from './blockRouter.js';
import roomRouter from './roomRouter.js';
import programRouter from './programRouter.js';
import departmentRouter from './departmentRouter.js';

const router = express.Router();
const reportsDir = `${getRootDir()}/reports`;

/**
 * @route GET /admin
 * @desc Display the admin page.
 */
router.get('/', (req, res) => {
    res.send('admin page');
});

router.use('/staff', authorizeAdmin(), staffRouter);

router.use('/student', studentRouter);

router.use('/exams', examRouter);

router.use('/config', authorizeAdmin(), configRouter);

router.use('/course', authorizeAdmin(), courseRouter);

router.use('/block', authorizeAdmin(), blockRouter);
router.use('/department-entry', authorizeAdmin(), departmentRouter);
router.use('/room-entry', authorizeAdmin(), roomRouter);
router.use('/program-entry', authorizeAdmin(), programRouter);

router.get('/departments', async (req, res) => {
    try {
        const departments = await getDepartments();
        res.json(departments);
    } catch (error) {
        logger.error(`Error in GET /departments: ${error.message}`);
        res.status(500).json({ error: 'Error fetching departments' });
    }
});

router.get('/programs', async (req, res) => {
    try {
        let { departmentCode } = req.query;
        const programs = await getPrograms(departmentCode);
        res.json(programs);
    } catch (error) {
        logger.error(`Error in GET /programs: ${error.message}`);
        res.status(500).json({ error: 'Error fetching programs' });
    }
});

router.get('/courses', async (req, res) => {
    try {
        const { programId, semester } = req.query;
        const courses = await getCourses(programId, semester);
        res.json(courses);
    } catch (error) {
        logger.error(`Error in GET /courses: ${error.message}`);
        res.status(500).json({ error: 'Error fetching courses' });
    }
});

router.get('/courses/exams', async (req, res) => {
    try {
        const { programId, semester } = req.query;
        logger.trace(programId, semester);
        const courses = await getCoursesExams(programId, semester);
        res.json(courses);
    } catch (error) {
        logger.error(`Error in GET /courses: ${error.message}`);
        res.status(500).json({ error: 'Error fetching courses' });
    }
});

router.get('/open-courses', async (req, res) => {
    const { programId } = req.query;

    if (!programId) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    try {
        const openCourses = await getAvailableOpenCourses(programId);
        return res.status(200).json(openCourses);
    } catch (error) {
        logger.error(`Error in GET /open-courses: ${error.message}`);
        return res.status(500).json({ error: 'Error fetching open courses' });
    }
});

router.get('/rooms/:examType', async (req, res) => {
    const { examType } = req.params;
    const { availability } = req.query || {};
    try {
        const rooms = await getRooms({ examType, availability });
        res.json(rooms);
    } catch (error) {
        logger.error(error, 'Error fetching rooms:');
        res.status(500).json({ error: 'Error fetching rooms' });
    }
});

router.get('/rooms', async (req, res) => {
    const { availability } = req.query || {};
    try {
        const rooms = await models.room.findAll({
            where:
                availability === undefined
                    ? undefined
                    : { isAvailable: availability },
        });
        res.json(rooms);
    } catch (error) {
        logger.error(error, 'Error fetching rooms:');
        res.status(500).json({ error: 'Error fetching rooms' });
    }
});

router.post('/rooms', authorizeAdmin(), async (req, res) => {
    const rooms = req.body;
    const failedRecords = [];

    try {
        await Promise.all(
            rooms.map(async (room) => {
                try {
                    await models.room.upsert(room, { where: { id: room.id } });
                } catch (error) {
                    logger.error(error);
                    failedRecords.push({ room, error: error.message });
                }
            }),
        );

        res.status(200).json({
            success: true,
            failedRecords,
        });
    } catch (error) {
        logger.error(error, 'Error posting rooms:');
        res.status(500).json({
            success: false,
            message: 'Internal server error.',
            error: error.message,
        });
    }
});

router.patch('/rooms', authorizeAdmin(), async (req, res) => {
    const room = req.body;

    try {
        const [updateCount] = await models.room.update(room, {
            where: { id: room.id },
        });
        return res.json({ updateCount });
    } catch (error) {
        logger.error(error);
        res.sendStatus(400);
    }
});

router.get('/date-time-id', async (req, res) => {
    try {
        const { date = new dayjs(), timeCode = 'AN' } = req.query;
        const dateTime = await getDateTimeId(date, timeCode);
        res.status(200).json({ dateTimeId: dateTime.id });
    } catch (error) {
        logger.error(error, 'Error getting dateTimeId:');
        res.status(500).json({ error: 'Error fetching dateTimeId' });
    }
});

router.patch('/rooms-availability', async (req, res) => {
    const { roomIds } = req.body;

    if (!roomIds || !Array.isArray(roomIds)) {
        return res.status(400).json({ error: 'Invalid roomIds' });
    }

    try {
        await updateRoomAvailability({ roomIds });
        return res.json({ message: 'Room availability updated successfully' });
    } catch (error) {
        logger.error(`Error in PATCH /rooms: ${error.message}`);
        return res
            .status(500)
            .json({ error: 'Failed to update room availability' });
    }
});

router.patch('/rooms/:examType', async (req, res) => {
    const room = req.body;
    const { examType } = req.params;

    try {
        let roomData = {};
        if (examType === 'final') {
            roomData.finalRows = room.rows;
            roomData.finalCols = room.cols;
        } else {
            roomData.internalRows = room.rows;
            roomData.internalCols = room.cols;
        }
        const [updateCount] = await models.room.update(roomData, {
            where: { id: room.id },
        });

        return res.json({ updateCount });
    } catch (error) {
        logger.error(`Error in PATCH /rooms/${examType}: ${error.message}`);
        return res.status(500).json({ error: 'Failed to update room' });
    }
});

router.get('/exam', async (req, res) => {
    try {
        const { courseId } = req.query;
        const examDateTime = await getExamDateTime({ courseId });
        if (examDateTime) {
            res.json(examDateTime);
        } else {
            res.sendStatus(204);
        }
    } catch (error) {
        logger.error(`Error in GET /exam: ${error.message}`);
        res.status(500).json({ error: 'Error fetching exam details' });
    }
});

router.get('/examines-count', async (req, res) => {
    const { date, timeCode } = req.query;
    try {
        const examineesByProgram = await countExamineesByProgramForDate({
            targetDate: date,
            timeCode,
        });
        res.json(examineesByProgram);
    } catch (error) {
        logger.error(error, 'Error counting exams for date:');
        res.status(500).json({ error: 'Error counting exams for date' });
    }
});

router.get('/download/report/:examName', (req, res) => {
    try {
        const { examName } = req.params;

        if (!examName) {
            res.sendStatus(400);
            return;
        }

        const outputFilePath = path.join(reportsDir, `${examName}`);

        // Check if the file exists
        if (!fs.existsSync(outputFilePath)) {
            res.status(404).send('Report not found');
            return;
        }

        // Set headers for the response
        res.setHeader('Content-Type', 'routerlication/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=output.zip');

        // Pipe the saved zip file to the client response
        const fileStream = fs.createReadStream(outputFilePath);

        // Handle stream errors
        fileStream.on('error', (error) => {
            logger.error(error, 'Error streaming report file: ');
            res.sendStatus(500);
        });

        // Pipe the file stream to the response
        fileStream.pipe(res);
    } catch (error) {
        logger.error(error, 'Error on report download: ');
        res.sendStatus(500);
    }
});

router.get('/reports/:fileName', (req, res) => {
    const { fileName } = req.params;

    // Validate and sanitize the fileName to prevent directory traversal attacks
    if (fileName.includes('..') || fileName.includes('/')) {
        return res.status(400).send('Invalid file name');
    }

    const filePath = path.join(getRootDir(), 'pdf', fileName);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        try {
            // Set the Content-Disposition header for download
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${fileName}"`,
            );

            // Stream the file to the response
            const fileStream = fs.createReadStream(filePath);

            // Handle any errors that occur during streaming
            fileStream.on('error', (error) => {
                logger.error(`Error streaming file: ${error}`);
                res.status(500).send('Error streaming the file');
            });

            // Stream the file to the response
            return fileStream.pipe(res);
        } catch (error) {
            logger.error(`Error serving file ( /public/:fileName ): ${error}`);
            return res.status(500).send('Error serving the file');
        }
    } else {
        // Handle the case when the file does not exist
        return res.status(404).send('File not found');
    }
});

router.delete('/reports/:fileName', authorizeAdmin(), (req, res) => {
    const { fileName } = req.params;

    // Validate and sanitize the fileName to prevent directory traversal attacks
    if (fileName.includes('..')) {
        const errorMessage = `Error in DELETE /reports/${fileName}: Invalid file name - ${fileName}`;
        logger.error(errorMessage);
        return res.status(400).send('Invalid file name');
    }

    const filePath = path.join(reportsDir, fileName);

    try {
        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Attempt to remove the file
            fs.unlinkSync(filePath);
            logger.trace(`File deleted: ${filePath}`);
            return res.status(204).send(); // Send a success response with no content
        }
        // Handle the case when the file does not exist
        const errorMessage = `Error in DELETE /reports/${fileName}: File not found - ${filePath}`;
        logger.error(errorMessage);
        return res.status(404).send('File not found');
    } catch (error) {
        const errorMessage = `Error in DELETE /reports/${fileName}: Error removing file - ${error}`;
        logger.error(errorMessage);
        return res.status(500).send('Internal Server Error');
    }
});

router.get('/reports', async (req, res) => {
    try {
        const files = await fs.promises.readdir(reportsDir);

        const reportsListPromises = files.map(async (file) => {
            const filePath = path.join(reportsDir, file);
            const stats = await fs.promises.stat(filePath);

            return {
                name: file,
                created: stats.birthtime,
            };
        });

        const reportsList = await Promise.all(reportsListPromises);

        reportsList.sort((a, b) => b.created - a.created);

        const sortedFileNames = reportsList.map((file) => file.name);

        res.json(sortedFileNames);
    } catch (error) {
        const errorMessage = `Error in GET /reports: ${error.message}`;
        logger.error(errorMessage);
        res.status(500).send('Error listing PDFs.');
    }
});

router.patch('/profile', async (req, res) => {
    const profileInfo = req.body;

    if (!profileInfo || !profileInfo.password) {
        return res.status(400).send('Invalid request data');
    }

    logger.trace(req.user);

    try {
        const { password, ...otherProfileFields } = profileInfo;
        const { email, id } = req.user;

        // Check credentials and retrieve user data
        const userData = await checkCredentialsAndRetrieveData(email, password);

        if (userData) {
            // Construct the update object based on provided values
            const updateObject = {};

            // Add password to updateObject if provided
            if (otherProfileFields.newPassword) {
                const hashedPassword = await encrypt(
                    otherProfileFields.newPassword,
                );
                updateObject.password = hashedPassword;
            }

            // Add other profile fields to updateObject if provided
            Object.keys(otherProfileFields).forEach((field) => {
                if (otherProfileFields[field]) {
                    updateObject[field] = otherProfileFields[field];
                }
            });

            // Update the user's profile fields if there's anything to update
            if (Object.keys(updateObject).length > 0) {
                const [updatedCount] = await models.authUser.update(
                    updateObject,
                    { where: { email } },
                );

                if (updatedCount > 0) {
                    const user = await models.authUser.findOne({
                        where: {
                            id,
                        },
                        attributes: [
                            'id',
                            'name',
                            'designation',
                            'role',
                            'email',
                            'phone',
                        ],
                    });

                    // Credentials match and user is authorized
                    const updatedUserData = user.get();

                    // Set a new refresh token
                    if (await setNewRefreshToken(res, updatedUserData)) {
                        return res.json({ user: updatedUserData });
                    }
                    throw new Error('Failed to set a new refresh token');
                }
            }
        }

        // Authentication failed or user not found
        return res.status(403).send('Invalid credentials or not authorized.');
    } catch (error) {
        logger.error(error, 'Error updating profile!');
        return res.status(500).send('Internal Server Error');
    }
});

export default router;
