import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    const p = getroot() + '/src/Views/block.html';

    res.sendFile(p);
});
router.post('/block', (req, res) => {
    let body = req.body;
    let id = body.id;
    let name = body.name;
    let blocks = [];
    blocks.push({
        id,
        name,
    });

    models.block
        .bulkCreate(blocks)
        .then(() => {
            res.send(blocks);
        })
        .catch((error) => {
            console.error('Error in inserting into DB:', error);
            res.status(500).send('Error inserting values into DB');
        });
});

export default router;
