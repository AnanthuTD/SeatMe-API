/* eslint-disable prettier/prettier */
import express from 'express';
import { models } from '../sequelize/models.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('staff page');
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
            {  model: models.course,
              attributes: ['name'],
              include : {
                model: models.programCourse,
                attributes: ['program_id'],
                include : {
                    model: models.program,
                    attributes: ['name']
                }
              }}
               
                    ]            
        },
        ],
      });
      
      
    return res.json(data);
});

export default router;
