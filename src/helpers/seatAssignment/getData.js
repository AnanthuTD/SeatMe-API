import { Op } from 'sequelize';
import { models } from '../../sequelize/models.js';

async function fetchExams(date) {
    try {
        const data = await models.dateTime.findAll({
            where: { date },
            include: {
                model: models.course,
                // through: { attributes: [] },
                nested: true,
                attributes: ['id', 'name', 'semester'],
                include: {
                    model: models.program,
                    attributes: ['id', 'name'],
                    through: {
                        attributes: [],
                    },
                },
            },
            attributes: [],
        });
        return data;
    } catch (error) {
        throw new Error(`Error fetching data: ${error.message}`);
    }
}

async function fetchStudents(data, orderBy = '') {
    try {
        const students = await models.student.findAll({
            where: {
                [Op.or]: data.flatMap((dateTime) =>
                    dateTime.courses.flatMap((course) =>
                        course.programs.map((program) => ({
                            programId: program.id,
                            semester: course.semester,
                        })),
                    ),
                ),
            },
            order: [[orderBy, 'ASC']],
            attributes: ['name', 'id', 'semester', 'programId', 'rollNumber'],
            raw: true,
        });
        return students;
    } catch (error) {
        throw new Error(`Error fetching students: ${error.message}`);
    }
}

// Function to match students with programs and courses
function matchStudentsWithData(students, data) {
    students.forEach((student) => {
        data.forEach((dateTime) =>
            dateTime.courses.forEach((course) =>
                course.programs.forEach((program) => {
                    if (
                        program.id === student.programId &&
                        course.semester === student.semester
                    ) {
                        student.programName = program.name;
                        student.courseName = course.name;
                        student.courseId = course.id;
                        student.examId = course.exam.id;
                    }
                }),
            ),
        );
    });
}

// Function to group students by courseId
/**
 *
 * @param {*} students
 * @type {import('./type.js').NestedStudentArray } NestedStudentArray
 * @returns {NestedStudentArray}
 */
function groupStudentsByCourseId(students) {
    const groupedStudents = {};

    students.forEach((student) => {
        const { courseId } = student;

        if (!groupedStudents[courseId]) {
            groupedStudents[courseId] = [];
        }

        groupedStudents[courseId].push(student);
    });

    return Object.values(groupedStudents);
}

// Main function to execute the code
export default async function getData(date, orderBy = 'rollNumber') {
    try {
        const data = await fetchExams(date);
        // console.log(JSON.stringify(data, null, 4));

        const students = await fetchStudents(data, orderBy);
        // console.log(JSON.stringify(students, null, 4));
        const totalStudents = students.length;

        matchStudentsWithData(students, data);

        const groupedStudents = groupStudentsByCourseId(students);

        // console.log(JSON.stringify(groupedStudents, null, 4));

        return [groupedStudents, totalStudents];
    } catch (error) {
        console.error(error.message);
        return null;
    }
}
getData(new Date());
