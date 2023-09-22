import { models } from '../src/sequelize/models.js';

export default function generateDummyData() {
    const depNum = 5;
    const programsNum = [3, 3, 4, 3, 2];
    let totalPrograms = 1;
    const totalProgramsNum = 15;
    const programs = [];
    const blockIds = [1, 2, 3, 4, 5]; // Replace with your actual block IDs

    for (let dep = 1; dep <= depNum; dep += 1) {
        for (
            let program = 1;
            program <= programsNum[dep - 1] &&
            totalPrograms <= totalProgramsNum;
            program += 1, totalPrograms += 1
        ) {
            const blockId =
                blockIds[Math.floor(Math.random() * blockIds.length)]; // Random block ID from the array
            programs.push({
                id: totalPrograms,
                name: `Program_${totalPrograms}`,
                duration: 3,
                level: 'UG',
                DepartmentId: blockId,
            });
        }
    }

    return programs; // Return an object with the length of the programs array.
}

const dummyData = generateDummyData();
console.log(dummyData);
models.Program.bulkCreate(dummyData);
// let attr = models.Program.getAttributes();
// console.log(attr);
