/* eslint-disable prettier/prettier */
import express from 'express';
import { Op } from 'sequelize';
import { models, sequelize } from '../sequelize/models.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const staffId = req.user.id;
        let onDuty;
        const currentDate = new Date();
        console.log(currentDate);
        const today = currentDate
            .toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
            .split(',')[0];
        console.log(today);

        // Use await with findOne to wait for the query to complete
        const dateEntry = await models.dateTime.findOne({
            where: {
                date: today,
            },
        });

        let examDetails = [];

        if (dateEntry) {
            // Use await with findAll to wait for the query to complete
            examDetails = await models.teacherSeat.findAll({
                where: {
                    date_time_id: dateEntry.id,
                    auth_user_id: staffId,
                },
                include: [
                    {
                        model: models.dateTime,
                    },
                    {
                        model: models.room,
                        attributes: ['floor', 'block_id'],
                        include: {
                            model: models.block,
                        },
                    },
                ],
            });

            if (examDetails.length > 0) {
                onDuty = true;
            } else {
                onDuty = false;
            }
        } else {
            onDuty = false;
            console.log('No dateTime entry found for today');
        }

        res.json({ onDuty, examDetails });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

/*
 ROuter     :       /attendance
Dsescription:      To get Students of specified Room id 
Access      :       PUBLIC
Parameters  :        rid
Method      :        GET
 */
router.get('/attendance/:roomId/:dateTimeId', async (req, res) => {
    const { roomId, dateTimeId } = req.params;

    const exams = await models.exam.findAll({
        where: {
            date_time_id: dateTimeId,
        },
    });
    const examIdsArray = exams.map((exam) => exam.id);

    const data = await models.studentSeat.findAll({
        where: {
            room_id: roomId,
            exam_id: {
                [Op.in]: examIdsArray,
            },
        },
        include: [
            {
                model: models.student,
                attributes: ['id', 'name', 'roll_number'],
            },
            {
                model: models.exam,
                attributes: ['course_id'],
                include: [
                    {
                        model: models.course,
                        attributes: ['name'],
                        include: {
                            model: models.programCourse,
                            attributes: ['program_id'],
                            include: {
                                model: models.program,
                                attributes: ['id', 'name','abbreviation'],
                            },
                        },
                    },
                ],
            },
        ],
        order: [
            [{ model: models.exam, as: 'exam' }, { model: models.course }, { model: models.programCourse }, { model: models.program }, 'id', 'ASC'],
        ],
    });
    

    return res.json(data);
});

/*
 ROuter     :       /attendance
Dsescription:      To update attendance of student 
Access      :       PUBLIC
Parameters  :        null
Method      :        POST
 */

router.post('/attendance/:teacherSeatId', async (req, res) => {
    try {
        const absentees = req.body;

        const { teacherSeatId } = req.params;
        const examIdsArray = absentees.map((std) => std.examId);
        const studentIdsArray = absentees.map((std) => std.studentId);

        await sequelize.transaction(async (t) => {
            const [updateCount] = await models.teacherSeat.update(
                { attendanceSubmitted: true },
                {
                    where: { id: teacherSeatId, attendanceSubmitted: false },
                    transaction: t,
                },
            );

            if (updateCount === 0) {
                await t.rollback();
                res.status(400).json({
                    message: 'Attendance already submitted.',
                });
                return;
            }

            await models.studentSeat.update(
                { isPresent: false },
                {
                    where: {
                        student_id: {
                            [Op.in]: studentIdsArray,
                        },
                        exam_id: {
                            [Op.in]: examIdsArray,
                        },
                    },
                    transaction: t,
                },
            );

            res.status(200).json({
                message: 'Attendance submitted successfully.',
            });
        });
    } catch (error) {
        console.error('Error updating the database:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});

export default router;
