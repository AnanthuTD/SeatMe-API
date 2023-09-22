import { models } from '../src/sequelize/models.js';

export default function generateDummyData() {
    const courseNum = 3;
    const courses = [];
    const semNum = 6;

    let course = 1;

    for (let i = 1; i <= 15; i += 1) {
        for (let sem = 1; sem <= semNum; sem += 1) {
            for (let j = 1; j <= courseNum; j += 1, course += 1) {
                courses.push({
                    id: `AB${sem}CDE${String(course).padStart(2, '0')}`,
                    name: `Course_${course}`,
                    semester: sem,
                    // date_time_id:
                });
                if (course === 99) return courses;
            }
        }
    }
    return courses;
}

const dummyData = generateDummyData();
// console.log(dummyData);
models.Course.bulkCreate(dummyData);
