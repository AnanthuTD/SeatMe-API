import { models } from '../src/sequelize/models.js';

const { block } = models;
function generateDummyBlockData() {
    const numberOfEntries = 5;
    const dummyData = [];

    for (let i = 1; i <= numberOfEntries; i += 1) {
        // Generate a random integer for the id (you can customize the range as needed)
        const id = i;

        // Generate a random name (you can customize this as well)
        const name = `Block_${i}`;

        // Create a dummy data entry and push it to the array
        dummyData.push({
            id,
            name,
        });
    }

    return dummyData;
}

const blockData = generateDummyBlockData();
block.bulkCreate(blockData);
