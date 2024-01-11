import express from 'express';
import { models } from '../../sequelize/models.js';
import { retrieveAndStoreSeatingInfoInRedis } from '../../helpers/adminHelpers/studentSeat.js';
import { loadSeatingAvailabilityTimesToRedis } from '../../redis/loadSeatingAvailabilityTimes.js';
import { updateSeatingInfoRedis } from '../../redis/seatingInfo.js';

const router = express.Router();

router.get('/seating-availability-schedule', async (req, res) => {
    try {
        const seatingAvailabilitySchedule =
            await models.seatingTimeConfig.findAll();
        res.json(seatingAvailabilitySchedule);
    } catch (error) {
        console.error('Error retrieving seating arrangement time:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/seating-availability-schedule/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await models.seatingTimeConfig.destroy({ where: { id } });

        await loadSeatingAvailabilityTimesToRedis();

        updateSeatingInfoRedis();

        res.status(200).json({
            message: 'Seating arrangement time updated successfully.',
        });
    } catch (error) {
        console.error('Error setting seating arrangement time:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/seating-availability-schedule', async (req, res) => {
    try {
        const { day, startTime, endTime, timeCode } = req.body;

        console.log(req.body);

        await models.seatingTimeConfig.upsert(
            {
                day,
                timeCode,
                startTime,
                endTime,
            },
            { where: { day, timeCode } },
        );

        loadSeatingAvailabilityTimesToRedis();

        retrieveAndStoreSeatingInfoInRedis();

        res.status(200).json({
            message: 'Seating arrangement time updated successfully.',
        });
    } catch (error) {
        console.error('Error setting seating arrangement time:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
