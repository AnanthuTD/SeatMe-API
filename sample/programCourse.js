import { models } from '../src/sequelize/models.js';

export default function generateDummyData(course) {
    const programCourse = [];

    for (let n = 1; n <= 360; n += 1) {
        const programId = Math.floor(Math.random() * 15 + 1);
        if (course[n - 1].id) {
            programCourse.push({
                ProgramId: programId,
                CourseId: course[n - 1].id,
            });
        }
    }

    return programCourse; // Return an object with the length of the programs array.
}

const course = await models.Course.findAll({ attributes: ['id'] });
console.log(JSON.stringify(course, null, 4));

const dummyData = generateDummyData(course);
console.log(dummyData);
models.programCourse.bulkCreate(dummyData);
// let attr = models.Program.getAttributes();
// console.log(attr);
