import { Op } from 'sequelize';
import { models } from '../../sequelize/models.js';

// Function to fetch data from the database
async function fetchData(date) {
    try {
        const data = await models.dateTime.findAll({
            where: { date },
            include: {
                model: models.course,
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

// Function to fetch students from the database
async function fetchStudents(data, orderBy = '') {
    try {
        const students = await models.student.findAll({
            where: {
                [Op.or]: data.flatMap((dateTime) =>
                    dateTime.Courses.flatMap((course) =>
                        course.Programs.map((program) => ({
                            programId: program.id,
                            semester: course.semester,
                        })),
                    ),
                ),
            },
            order: [[orderBy, 'ASC']],
            attributes: ['name', 'id', 'semester', 'program_id', 'roll_number'],
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
            dateTime.Courses.forEach((course) =>
                course.Programs.forEach((program) => {
                    if (
                        program.id === student.program_id &&
                        course.semester === student.semester
                    ) {
                        student.programName = program.name;
                        student.courseName = course.name;
                        student.courseId = course.id;
                    }
                }),
            ),
        );
    });
}

// Function to group students by courseId
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
export default async function getData(orderBy = 'roll_number') {
    const date = new Date().toISOString().split('T')[0];

    try {
        const data = await fetchData(date);
        const students = await fetchStudents(data, orderBy);
        const totalStudents = students.length;

        // console.log(JSON.stringify(students, null, 4));

        matchStudentsWithData(students, data);

        const exams = groupStudentsByCourseId(students);

        // console.log(JSON.stringify(exams, null, 4));

        return { exams, totalStudents };
    } catch (error) {
        console.error(error.message);
        return null;
    }
}
// getData();
