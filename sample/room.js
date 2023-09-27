import { models } from '../src/sequelize/models.js';

function generateDummyRoomData() {
    const numberOfEntries = 5 * 3 * 7;
    const dummyData = [];
    const blockIds = [1, 2, 3, 4, 5]; // Replace with your actual block IDs

    for (let i = 1; i <= numberOfEntries; i += 1) {
        const id = i;
        const cols = Math.floor(Math.random() * (6 - 4 + 1)) + 4; // Random number of columns (4 to 6)
        const rows = Math.floor(Math.random() * (7 - 4 + 1)) + 4; // Random number of rows (4 to 7)
        const isAvailable = Math.random() < 0.5 ? 1 : 0; // Random availability (50% chance)
        const floor = Math.floor(Math.random() * 3) + 1; // Random floor (1 to 3)
        const blockId = blockIds[Math.floor(Math.random() * blockIds.length)]; // Random block ID from the array

        dummyData.push({
            id,
            cols,
            rows,
            is_available: isAvailable,
            floor,
            block_id: blockId,
        });
    }

    return dummyData;
}

const roomData = generateDummyRoomData();
// console.log(roomData);
models.room.bulkCreate(roomData);
