import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    let p = getroot() + '/src/Views/department.html';

    //res.sendFile(p);
});
router.post('/department', (req, res) => {
    console.log('this is called');
    console.log(req.body);
    let body = req.body.departments;
    let deps = [];
    body.forEach((item) => {
        let id = item.id;
        let name = item.name;
        deps.push({
            id,
            name,
        });
        console.log(deps);
        console.log(`ID: ${item.id}, Name: ${item.name}`);
    });
    let name = req.body.name;

    console.log(deps);

    models.department
        .bulkCreate(deps, { validate: true })
        .then(() => {
            res.send(deps);
        })
        .catch((error) => {
            console.error('Error in inserting into DB:', error);

            // Sending SQL error message to frontend
            res.status(500).json({ error: 'Error inserting values into DB', sqlError: error.message });
        });
});

export default router;
