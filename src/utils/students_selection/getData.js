import { Op } from 'sequelize';
import { models, sequelize } from '../../sequelize/models.js';

const date = new Date().toISOString().split('T')[0];

let data = await models.DateTime.findAll({
    where: { date },
    include: {
        model: models.Course,
        nested: true,
        attributes: ['id', 'name', 'semester'],
        include: {
            model: models.Program,
            attributes: ['id', 'name'],
            through: {
                attributes: [],
            },
        },
    },
    attributes: [],
});
// console.log(JSON.stringify(data, null, 4));

const students = await models.Student.findAll({
    where: {
        [Op.or]: data.flatMap((dateTime) =>
            dateTime.Courses.flatMap((course) =>
                course.Programs.map((program) => ({
                    ProgramId: program.id,
                    semester: course.semester,
                })),
            ),
        ),
    },
    attributes: ['name', 'id', 'semester', 'program_id'],
    raw: true,
});

students.map((student) => {
    // Use find to search for the matching program in the data structure
    data.forEach((dateTime) =>
        dateTime.Courses.forEach((course) =>
            course.Programs.forEach((program) => {
                /* console.log(
                    JSON.stringify(program, null, 4),
                    JSON.stringify(student, null, 4),
                    JSON.stringify(course, null, 4),
                ); */
                if (
                    program.id === student.program_id &&
                    course.semester === student.semester
                ) {
                    student.programName = program.name;
                    student.courseName = course.name;
                    student.courseId = course.id;
                    return student;
                }
                return null;
            }),
        ),
    );
});

console.log(JSON.stringify(students, null, 4));

const groupedStudents = {};

students.forEach((student) => {
    const { courseId } = student;

    if (!groupedStudents[courseId]) {
        groupedStudents[courseId] = [];
    }

    groupedStudents[courseId].push(student);
});

// Convert the groupedStudents object to an array of arrays
const arrayOfArrays = Object.values(groupedStudents);

console.log(JSON.stringify(arrayOfArrays, null, 4));
