import { models } from '../src/sequelize/models.js';

export default function generateDummyData() {
    const depNum = 5;
    const deps = [];

    for (let dep = 1; dep <= depNum; dep += 1) {
        deps.push({
            id: dep,
            name: `Department_${dep}`,
        });
    }

    return deps;
}

const dummyData = generateDummyData();
// console.log(dummyData);
models.Department.bulkCreate(dummyData);
