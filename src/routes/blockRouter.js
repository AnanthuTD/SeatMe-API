import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    const p = getroot() + '/src/Views/block.html';

    res.sendFile(p);
});
router.post('/block', (req, res) => {
    console.log('this is called')
    let body = req.body.blocks;
    let blocks = [];
    body.forEach((item) => {
        let id = item.id;
        let name = item.name;
        blocks.push({
            id,
            name,
        });
        console.log(blocks);
        console.log(`ID: ${item.id}, Name: ${item.name}`);
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
