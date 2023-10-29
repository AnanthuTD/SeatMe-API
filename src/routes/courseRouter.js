import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    let p = getroot() + '/src/Views/department.html';

    //res.sendFile(p);
});
router.post('/course', (req, res) => {
    console.log('this is called');
    console.log(req.body);
    let body = req.body.courses;
    let courses = [];
    body.forEach((item) => {
        let id = item.id;
        let name = item.name;
        courses.push({
            id,
            name,
        });
        console.log(courses);
        console.log(`ID: ${item.id}, Name: ${item.name}`);
    });

    console.log(courses);

    models.course
        .bulkCreate(courses)
        .then(() => {
            res.send(courses);
        })
        .catch((error) => {
            console.error('Error in inserting into DB:', error);
            res.status(500).send('Error inserting values into DB');
        });
});

export default router;
