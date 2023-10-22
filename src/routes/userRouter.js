import express from 'express';
import { getTimeTableAndSeating } from '../helpers/adminHelpers/studentSeat.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const { studentId } = req.query;
    const data = await getTimeTableAndSeating(studentId);

    return res.json(data);
});

export default router;
