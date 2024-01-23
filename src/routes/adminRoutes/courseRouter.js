import express from 'express';
import logger from '../../helpers/logger.js';
import { models, sequelize } from '../../sequelize/models.js';

const router = express.Router();

router.get('/common2', async (req, res) => {
    try {
        const common2 = await models.course.findAll({
            where: {
                type: 'common2',
            },
            include: [
                {
                    model: models.programCourse,
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    'name',
                    'id',
                    'semester',
                    [sequelize.col('programCourses.program_id'), 'programId'],
                ],
            },
            raw: true,
        });
        res.json(common2);
    } catch (error) {
        logger.error(error, 'Error while fetching /common2');
        res.status(500).json({
            message: 'An error occurred while retrieving common2 courses.',
        });
    }
});

export default router;
