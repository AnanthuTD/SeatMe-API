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
router.patch('/blockupdate/', async (req, res) => {
    try {
        let blocks = [];
        req.body.forEach((item) => {
            let id = item.id;
            let name = item.name;
            blocks.push({
                id,
                name,
            });
          //  console.log(blocks,"hai this is patch");
        });
        blocks.forEach((block) => {
            const blockId = block.id;
            const blockName = block.name;
        
            // Use the values as needed
            console.log('block ID:', blockId);
            console.log('block Name:', blockName);
            console.log('----------------------');
        });
        const updates = blocks.map(async (block1) => {
            // Find the block by blockId
            const block = await models.block.findByPk(block1.id);

            if (!block) {
                return { error: `block with ID ${block1.id} not found` };
            }

            let updatedData = {
                name: block1.name,
            };

            // Update the block with the provided data
            await block.update(updatedData);

            return { message: `block with ID ${block1.id} updated successfully`, updatedblock: block };
        });

        // Wait for all updates to complete before sending the response
        const results = await Promise.all(updates);

        // Check for errors in the results
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
            return res.status(404).json({ errors });
        }

        // If no errors, send a success response
        res.status(200).json({ message: 'All blocks updated successfully', results });
    } catch (error) {
        console.error('Error updating block in DB:', error);
        res.status(500).json({ error: 'Error updating block in DB', errorMessage: error.message });
    }
});
export default router;
