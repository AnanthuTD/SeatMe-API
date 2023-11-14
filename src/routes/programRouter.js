import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    let p = getroot() + '/src/Views/department.html';

    //res.sendFile(p);
});
router.post('/program', (req, res) => {
    console.log('this is called');
    console.log(req.body);
    let body = req.body.programs;
    let programs = [];
    body.forEach((item) => {
        let id = item.id;
        let name = item.name;
        let duration = item.duration;
        let level = item.level;
        let department_id = item.departmentId;
        programs.push({
            id,
            name,
            duration,
            level,
            department_id,
        });
        console.log(programs);
    });

    console.log(programs);

    models.program
        .bulkCreate(programs)
        .then(() => {
            res.send(programs);
        })
        .catch((error) => {
            console.error('Error in inserting into DB:', error);
            res.status(500).send('Error inserting values into DB');
        });
});

export default router;
