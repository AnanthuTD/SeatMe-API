import express from 'express';
import { models } from '../../sequelize/models.js';
import logger from '../../helpers/logger.js';
import { authorizeAdmin } from '../../helpers/commonHelper.js';
import { getBlocks } from '../../helpers/adminHelpers/adminHelper.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const blocks = await getBlocks();
        res.json(blocks);
    } catch (error) {
        logger.error(`Error in GET /blocks: ${error.message}`);
        res.status(500).json({ error: 'Error fetching departments' });
    }
});

// Add a new route for handling block deletion
router.delete('/:blockId', authorizeAdmin(), async (req, res) => {
    const { blockId } = req.params;

    try {
        const deletedBlock = await models.block.destroy({
            where: {
                id: blockId,
            },
        });

        if (deletedBlock > 0) {
            return res.status(200).json({
                message: `Block with ID ${blockId} deleted successfully`,
            });
        }

        return res.status(404).json({
            error: `Block with ID ${blockId} not found`,
        });
    } catch (error) {
        console.error('Error deleting block:', error);
        return res.status(500).json({
            error: 'Error deleting block',
            errorMessage: error.message,
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const body = req.body.blocks;
        const blocks = body.map((item) => ({ id: item.id }));

        const createdBlocks = await models.block.bulkCreate(blocks, {
            validate: true,
            ignoreDuplicates: true, // Sequelize option to ignore duplicates
        });

        const successfulBlocks = createdBlocks.filter(
            (block) => block.isNewRecord,
        );

        res.send(successfulBlocks);
    } catch (error) {
        logger.error(error, 'Error inserting into DB:');
        res.status(500).send('Error inserting values into DB');
    }
});

router.patch('/', async (req, res) => {
    try {
        const { prevId, id } = req.body;
        console.log(prevId, id);

        // Find the block by blockId
        await models.block.update({ id }, { where: { id: prevId } });

        res.status(200).json({
            message: `Block with ID ${id} updated successfully`,
        });
    } catch (error) {
        logger.error(error, 'Error updating block in DB');
        res.status(500).json({
            error: 'Error updating block in DB',
            errorMessage: error.message,
        });
    }
});
export default router;
