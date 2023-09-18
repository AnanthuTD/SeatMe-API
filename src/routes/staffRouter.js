import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('staff page');
});

export default router;
