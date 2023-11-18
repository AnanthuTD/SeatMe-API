import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    let p = getroot() + '/src/Views/department.html';

    //res.sendFile(p);
});
router.post('/room', (req, res) => {
    console.log('this is called');
   // console.log(req.body);
    let body = req.body.rooms;
    let rooms = [];
    body.forEach((item) => {
        let id = item.id;
        let internalRows=item.internalRows;
        let internalCols = item.internalCols;
        let finalRows = item.finalRows;
        let finalCols = item.finalCols;
        let isAvailable = item.isAvailable;
        let floor = item.floor;
        let blockId = item.block;
        rooms.push({
            id,
            internalRows,
            internalCols,
            finalRows,
            finalCols,
            isAvailable,
            floor,
            blockId,
        });
        console.log(rooms);
    });

    console.log(rooms);

    models.room
        .bulkCreate(rooms)
        .then(() => {
            res.send(rooms);
        })
        .catch((error) => {
            console.error('Error in inserting into DB:', error);
            res.status(500).send('Error inserting values into DB');
        });
});

export default router;
