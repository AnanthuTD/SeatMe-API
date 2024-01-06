import express from 'express';

import getroot from '../../getRootDir.js';

const router = express.Router();

router.get('/', (req, res) => {
    const p = `${getroot()}/src/Views/datetime.html`;

    res.sendFile(p);
});

export default router;
