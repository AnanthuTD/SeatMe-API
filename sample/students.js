import { models } from '../src/sequelize/models.js';

function generateUniqueID(program, j, i) {
    const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds.
    const uniqueID =
        String(program).padEnd(2, '0') + // Program (2 digits)
        String(j).padStart(3, '0') + // j (3 digits)
        String(i).padStart(3, '0') + // i (3 digits)
        String(timestamp).substr(-4); // Last 4 digits of the timestamp
    return uniqueID;
}

function generateUniqueRoll(year, program, i) {
    const roll = parseInt(
        year.padEnd(2, '0') +
            String(program).padStart(2, '0') +
            String(i).padStart(2, '0'),
        10,
    );
    if (roll > 999999) {
        console.log(
            year.padEnd(2, '0'),
            String(program).padEnd(2, '0'),
            i,
            String(i).padEnd(2, '0'),
        );
    }
    return roll;
}

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
    const sem = [2, 4, 6];
    const programs = 15;

    for (let program = 1; program <= programs; program += 1) {
        for (let j = 1; j <= 3; j += 1) {
            // Generate a random number of Students and students
            const studentsNum =
                Math.floor(Math.random() * (maxStudents - minStudents + 1)) +
                minStudents;
            for (let i = 1; i <= studentsNum; i += 1) {
                const student = {
                    id: generateUniqueID(program, j, i),

                    rollNumber: generateUniqueRoll(years[j - 1], program, i),
                    name: `Student_${i}`,
                    email: `Student_${i}@gmail.com`,
                    phone: parseInt(
                        `${String(program + 1).padEnd(2, '0')}${String(
                            i,
                        ).padStart(8, '0')}`,
                        10,
                    ),
                    semester: sem[j - 1],
                    programId: program,
                };
                students.push(student);
            }
        }
    }
    return students;
}

// Example usage:
const minStudents = 50;
const maxStudents = 99;

const dummyData = generateDummyData(minStudents, maxStudents);
// console.log(dummyData);
const result = await models.student.bulkCreate(dummyData, { validate: true });
console.log(result.length); // 2
console.log(result[0] instanceof models.student);
