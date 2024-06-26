import express from 'express';
import { models } from '../../sequelize/models.js';
import logger from '../../helpers/logger.js';
import { authorizeAdmin } from '../../helpers/commonHelper.js';

const router = express.Router();

router.post('/room', authorizeAdmin(), (req, res) => {
    logger.trace('this is called');
    // logger.trace(req.body);
    let body = req.body.rooms;
    let rooms = [];
    body.forEach((item) => {
        let { id } = item;
        let { internalRows } = item;
        let { internalCols } = item;
        let { finalRows } = item;
        let { finalCols } = item;
        let { isAvailable } = item;
        let { floor } = item;
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
    });

    models.room
        .bulkCreate(rooms, { validate: true })
        .then(() => {
            res.send(rooms);
        })
        .catch((error) => {
            logger.error(error, 'Error in inserting into DB:');
            res.status(500).send('Error inserting values into DB');
        });
});

export default router;
