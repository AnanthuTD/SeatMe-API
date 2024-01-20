import path from 'path';
import express from 'express';
import getRootDir from '../../getRootDir.js';
import { models } from '../sequelize/models.js';
import logger from '../helpers/logger.js';

const router = express.Router();

router.get('/', (req, res) => {
    const p = path.join(getRootDir(), 'src/Views/block.html');

    res.sendFile(p);
});

router.post('/block', async (req, res) => {
    try {
        const body = req.body.blocks;
        const blocks = body.map((item) => ({ id: item.id, name: item.name }));

        const createdBlocks = await models.block.bulkCreate(blocks, {
            validate: true,
            ignoreDuplicates: true, // Sequelize option to ignore duplicates
        });

        const successfulBlocks = createdBlocks.filter(
            (block) => block.isNewRecord,
        );

        res.send(successfulBlocks);
    } catch (error) {
        logger.error('Error inserting into DB:', error);
        res.status(500).send('Error inserting values into DB');
    }
});

router.patch('/blockupdate/', async (req, res) => {
    try {
        let blocks = [];
        req.body.forEach((item) => {
            let { id } = item;
            let { name } = item;
            blocks.push({
                id,
                name,
            });
        });
        const updates = blocks.map(async (block1) => {
            // Find the block by blockId
            const block = await models.block.findByPk(block1.id);

            if (!block) {
                return { error: `block with ID ${block1.id} not found` };
            }

            return {
                message: `block with ID ${block1.id} updated successfully`,
                updatedblock: block,
            };
        });

        // Wait for all updates to complete before sending the response
        const results = await Promise.all(updates);

        // Check for errors in the results
        const errors = results.filter((result) => result.error);
        if (errors.length > 0) {
            return res.status(404).json({ errors });
        }

        // If no errors, send a success response
        res.status(200).json({
            message: 'All blocks updated successfully',
            results,
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
