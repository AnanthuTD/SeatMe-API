/* eslint-disable prettier/prettier */
import express from 'express';
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
                        model: models.room,
                        attributes: ['rows', 'cols', 'floor', 'block_id'],
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
router.get('/attendance/:rid', async (req, res) => {
    const data = await models.studentSeat.findAll({
        where: {
            room_id: req.params.rid,
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
Dsescription:      To get Students of specified Room id 
Access      :       PUBLIC
Parameters  :        rid
Method      :        POST
 */

router.post('/attendance', (req, res) => {
    // Access the data sent in the POST request body (i.e., absentstd)
    const absentstd = req.body;
    console.log(absentstd);

    // Send a response indicating the data has been received and processed
    res.status(200).json({
        message: 'Data received and processed successfully',
    });
});

export default router;
