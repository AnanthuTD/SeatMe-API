import { Op } from 'sequelize';
import { models } from '../../sequelize/models.js';

async function fetchExams(date, timeCode) {
    try {
        const data = await models.course.findAll({
            attributes: ['id', 'name', 'semester', 'type'],
            include: [
                {
                    model: models.exam,
                    include: {
                        model: models.dateTime,
                        attributes: [],
                        where: { date, timeCode },
                    },
                    required: true,
                    attributes: ['id'],
                },
                {
                    model: models.program,
                    required: true,
                    attributes: ['id', 'name'],
                },
            ],
        });

        // console.log(JSON.stringify(data, null, 2));

        const openCourses = [];
        const nonOpenCourses = [];

        data.forEach((course) => {
            const courseDetails = {
                courseId: course.id,
                courseName: course.name,
                semester: course.semester,
                isOpenCourse: course.isOpenCourse,
                examId: course.exams[0].id,
            };

            course.programs.forEach((program) => {
                const programInfo = {
                    programId: program.id,
                    programName: program.name,
                };

                if (course.type === 'open') {
                    openCourses.push({ ...courseDetails, ...programInfo });
                } else {
                    nonOpenCourses.push({ ...courseDetails, ...programInfo });
                }
            });
        });

        // console.log(JSON.stringify(students, null, 2));

        return { openCourses, nonOpenCourses };
    } catch (error) {
        throw new Error(`Error fetching data: ${error.message}`);
    }
}

// fetchExams(new Date('2023-10-25'));

async function fetchStudents({ nonOpenCourses, openCourses, orderBy = '' }) {
    // console.log(JSON.stringify(nonOpenCourses, null, 2));
    try {
        const students1 = await models.student.findAll({
            where: {
                [Op.or]: nonOpenCourses.map((value) => {
                    return {
                        programId: value.programId,
                        semester: value.semester,
                    };
                }),
            },
            order: [[orderBy, 'ASC']],
            attributes: ['name', 'id', 'semester', 'programId', 'rollNumber'],
            raw: true,
        });
        const students2 = await models.student.findAll({
            where: {
                [Op.or]: openCourses.map((value) => {
                    return {
                        openCourseId: value.courseId,
                        semester: value.semester,
                    };
                }),
            },
            order: [[orderBy, 'ASC']],
            attributes: ['name', 'id', 'semester', 'programId', 'rollNumber'],
            raw: true,
        });
        const supplyStudents = await models.student.findAll({
            include: [
                {
                    model: models.supplementary,
                    where: nonOpenCourses.map((value) => {
                        return {
                            exam_id: value.examId,
                        };
                    }),
                },
            ],
            attributes: ['name', 'id', 'semester', 'programId', 'rollNumber'],
            order: [[orderBy, 'ASC']],
        });

        return [...students1, ...students2, ...supplyStudents];
    } catch (error) {
        throw new Error(`Error fetching students: ${error.message}`);
    }
}

// Function to match students with programs and courses
function matchStudentsWithData(students, data) {
    return students.map((student) => {
        data.forEach((value) => {
            if (
                value.programId === student.programId &&
                value.semester === student.semester
            ) {
                student.programName = value.programName;
                student.courseName = value.courseName;
                student.courseId = value.courseId;
                student.examId = value.examId;
            }
        });

        return student;
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
export default async function getData({
    date,
    timeCode,
    orderBy = 'rollNumber',
}) {
    try {
        const { nonOpenCourses, openCourses } = await fetchExams(
            date,
            timeCode,
        );
        // console.log(JSON.stringify(data, null, 4));

        const students = await fetchStudents({
            orderBy,
            nonOpenCourses,
            openCourses,
        });
        // console.log(JSON.stringify(students, null, 4));

        const totalStudents = students.length;

        const updateStudents = matchStudentsWithData(students, [
            ...openCourses,
            ...nonOpenCourses,
        ]);
        // console.log(JSON.stringify(updateStudents, null, 4));

        const groupedStudents = groupStudentsByCourseId(updateStudents);

        // console.log(JSON.stringify(groupedStudents, null, 4));

        return [groupedStudents, totalStudents];
    } catch (error) {
        console.error(error.message);
        return null;
    }
}
// getData(new Date('2023-10-25'));
export { fetchExams };
