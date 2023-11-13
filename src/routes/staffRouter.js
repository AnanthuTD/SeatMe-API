/* eslint-disable prettier/prettier */
import express from 'express';
import { Op } from 'sequelize';
import { models } from '../sequelize/models.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const staffId = req.user.id;
        let onDuty;
        const currentDate = new Date();
        const today = currentDate.toISOString().split('T')[0];

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
                            attributes: ['name'],
                        },
                    },
                ],
            });

            if (examDetails.length > 0) {
                onDuty = true;
            } else {
                onDuty = false;
            }

            console.log(examDetails);
        } else {
            onDuty = false;
            console.log('No dateTime entry found for today');
        }

        console.log(examDetails, onDuty);
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
router.get('/attendance/:rid/:dateid', async (req, res) => {
    const exams = await models.exam.findAll({
        where: {
            date_time_id: req.params.dateid,
        },
    });
    const examIdsArray = exams.map((exam) => exam.id);
    console.log(examIdsArray);

    const data = await models.studentSeat.findAll({
        where: {
            room_id: req.params.rid,
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
                                attributes: ['name'],
                            },
                        },
                    },
                ],
            },
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

router.post('/attendance', (req, res) => {
    // Access the data sent in the POST request body (i.e., absentstd)
 
   try {
    const absentstd = req.body;
    console.log(absentstd);
    const examIdsArray = absentstd.map((std) => std.examId);
    const studentIdsArray = absentstd.map((std) => std.studentId);
    console.log(studentIdsArray, examIdsArray);

    models.studentSeat.update(
        { isPresent: false},
        { where: { 
            student_id : {
                [Op.in] : studentIdsArray
            },
            exam_id : {
                [Op.in] : examIdsArray
            },
        } }
      );
      



    // Send a response indicating the data has been received and processed
    res.status(200).json({
        message: 'Data received and processed successfully',
    });
}catch (error) {
    // Handle any errors that occurred during the update operation
    console.error('Error updating the database:', error);
    res.status(500).json({
        message: 'Internal Server Error',
    });
}

});

export default router;
