import { models } from '../src/sequelize/models.js';

export default function generateDummyData() {
    const courseNum = 4;
    const courses = [];
    const semNum = 6;

    let course = 1;
    let dateTimeId = 1;

    for (let i = 1; i <= 15; i += 1) {
        for (let sem = 1; sem <= semNum; sem += 1) {
            for (let j = 1; j <= courseNum; j += 1, course += 1) {
                courses.push({
                    id: `AB${sem}CDE${String(course).padStart(3, '0')}`,
                    name: `Course_${course}`,
                    semester: sem,
                    DateTimeId: sem % 2 === 0 ? dateTimeId : null,
                });
                if (sem % 2 === 0) dateTimeId += 1;
                if (dateTimeId > 20) dateTimeId = 1;
                // if (course === 99) return courses;
            }
        }
    }
    return courses;
}

const dummyData = generateDummyData();
// console.log(dummyData);
models.Course.bulkCreate(dummyData);
