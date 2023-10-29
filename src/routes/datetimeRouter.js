import express from 'express';

const router = express.Router();

import getroot from '../../getRootDir.js';

import { models } from '../sequelize/models.js';

router.get('/', (req, res) => {
    const p = getroot() + '/src/Views/datetime.html';

    res.sendFile(p);
});

export default router;
