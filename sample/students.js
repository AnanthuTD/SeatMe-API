import { models } from '../src/sequelize/models.js';

/**
 * Generates random dummy data for Students and students within specified ranges.
 *
 * @param {number} minStudents - The minimum number of Students.
 * @param {number} maxStudents - The maximum number of Students.
 * @returns {Object} An object containing the following properties:
 *   - {Array<Array<Object>>} Students - An array of Students, where each subject is an array of objects representing students.
 *   - {number} totalStudents - The total number of students generated across all Students.
 */
export default function generateDummyData(minStudents, maxStudents) {
    const students = [];
    const years = ['23', '22', '21'];
    const programs = 15;

    for (let program = 1; program <= programs; program += 1) {
        for (let j = 1; j <= 3; j += 1) {
            // Generate a random number of Students and students
            const studentsNum =
                Math.floor(Math.random() * (maxStudents - minStudents + 1)) +
                minStudents;
            for (let i = 1; i <= studentsNum; i += 1) {
                const student = {
                    id:
                        String(program).padStart(2, '0') + // Program (2 digits)
                        String(j).padStart(5, '0') + // j (5 digits)
                        String(Math.floor(Math.random() * 1000)).padStart(
                            3,
                            '0',
                        ) + // Random 3-digit number
                        String(i).padStart(2, '0'), // i (2 digits)

                    roll_number: parseInt(
                        years[j - 1] +
                            String(program).padStart(2, '0') +
                            String(i).padStart(2, '0'),
                        10,
                    ),
                    name: `Student_${i}`,
                    email: `Student_${i}@gmail.com`,
                    phone: parseInt(
                        `${String(program + 1).padEnd(2, '0')}${String(
                            i,
                        ).padStart(8, '0')}`,
                        10,
                    ),

                    program_id: program,
                };
                students.push(student);
            }
        }
    }
    return students;
}

// Example usage:
const minStudents = 50;
const maxStudents = 100;

const dummyData = generateDummyData(minStudents, maxStudents);
// console.log(dummyData);
const result = await models.Student.bulkCreate(dummyData);
console.log(result.length); // 2
console.log(result[0] instanceof models.Student);
