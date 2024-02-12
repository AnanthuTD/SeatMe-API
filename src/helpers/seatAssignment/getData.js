import { Op } from 'sequelize';
import { models, sequelize } from '../../sequelize/models.js';
import dayjs from '../dayjs.js';
import logger from '../logger.js';

async function fetchExams(date, timeCode) {
    try {
        date = dayjs(date).tz('Asia/Kolkata').format('YYYY-MM-DD');
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
                    attributes: ['id', ['abbreviation', 'name']],
                },
            ],
        });

        const openCourses = [];
        const nonOpenCourses = [];
        const commonCourse2 = [];
        const uniqueCourseIds = new Set();

        data.forEach((course) => {
            const courseDetails = {
                courseId: course.id,
                courseName: course.name,
                semester: course.semester,
                courseType: course.type,
                examId: course.exams[0].id,
            };

            course.programs.forEach((program) => {
                const programInfo = {
                    programId: program.id,
                    programName: program.name,
                };

                if (course.type === 'open') {
                    openCourses.push({ ...courseDetails, ...programInfo });
                } else if (course.type === 'common2') {
                    if (!uniqueCourseIds.has(course.id)) {
                        commonCourse2.push({
                            ...courseDetails,
                            ...programInfo,
                        });
                        uniqueCourseIds.add(course.id);
                    }
                } else {
                    nonOpenCourses.push({ ...courseDetails, ...programInfo });
                }
            });
        });

        return { openCourses, nonOpenCourses, commonCourse2 };
    } catch (error) {
        throw new Error(`Error fetching data: ${error.message}`);
    }
}

function countStudentsByProgram(students) {
    const programCounts = {};

    students.forEach((student) => {
        const { programName } = student;

        if (!programCounts[programName]) {
            programCounts[programName] = 1;
        } else {
            programCounts[programName] += 1;
        }
    });

    return programCounts;
}

async function fetchStudents({
    nonOpenCourses,
    openCourses,
    commonCourse2,
    orderBy = '',
}) {
    try {
        const combinedNonOpenCourses = nonOpenCourses.map((value) => ({
            programId: value.programId,
            semester: value.semester,
        }));

        const combinedOpenCourses = openCourses.map((value) => ({
            openCourseId: value.courseId,
            semester: value.semester,
        }));

        const studentsOpenCourse = await models.student.findAll({
            where: {
                [Op.or]: [...combinedOpenCourses],
            },
            include: [
                {
                    model: models.program,
                    attributes: [['abbreviation', 'name']],
                },
            ],
            order: [[orderBy, 'ASC']],
            attributes: [
                'name',
                'id',
                'semester',
                'programId',
                'rollNumber',
                [sequelize.col('program.abbreviation'), 'programName'],
                [sequelize.col('open_course_id'), 'courseId'],
            ],
            raw: true,
        });

        const combinedCommonCourse2 = commonCourse2
            ?.map((value) => {
                if (value.semester === 1)
                    return {
                        secondLang_1: value.courseId,
                        semester: value.semester,
                    };
                if (value.semester === 2)
                    return {
                        secondLang_2: value.courseId,
                        semester: value.semester,
                    };
                return null;
            })
            .filter((item) => item !== null);

        const secondLang = await Promise.all(
            (combinedCommonCourse2 || []).map(async (course) => {
                const studentsSecondLang = await models.student.findAll({
                    where: course,
                    include: [
                        {
                            model: models.program,
                            attributes: [['abbreviation', 'name']],
                        },
                    ],
                    order: [[orderBy, 'ASC']],
                    attributes: [
                        'name',
                        'id',
                        'semester',
                        'programId',
                        'rollNumber',
                        [sequelize.col('program.abbreviation'), 'programName'],
                    ],
                    raw: true,
                });

                studentsSecondLang.forEach((student) => {
                    student.courseId =
                        course?.secondLang_2 || course?.secondLang_1;
                });

                return studentsSecondLang;
            }),
        );

        const studentsSecondLang = [].concat(...secondLang);

        const studentsNonOpenCourse = await models.student.findAll({
            where: {
                [Op.or]: [...combinedNonOpenCourses],
            },
            include: [
                {
                    model: models.program,
                    attributes: [['abbreviation', 'name']],
                },
            ],
            order: [[orderBy, 'ASC']],
            attributes: [
                'name',
                'id',
                'semester',
                'programId',
                'rollNumber',
                [sequelize.col('program.abbreviation'), 'programName'],
            ],
            raw: true,
        });

        const supplyStudents = await models.student.findAll({
            include: [
                {
                    model: models.supplementary,
                    where: {
                        exam_id: {
                            [Op.in]: [
                                ...nonOpenCourses.map((value) => value.examId),
                                ...openCourses.map((value) => value.examId),
                                ...commonCourse2.map((value) => value.examId),
                            ],
                        },
                    },
                    attributes: [],
                    required: true,
                    include: [
                        {
                            model: models.exam,
                            include: [
                                {
                                    model: models.course,
                                },
                            ],
                        },
                    ],
                },
                {
                    model: models.program,
                    attributes: [['abbreviation', 'name']],
                },
            ],
            order: [[orderBy, 'ASC']],
            attributes: [
                'name',
                'id',
                'semester',
                'programId',
                'rollNumber',
                [sequelize.col('supplementaries.exam_id'), 'examId'],
                [sequelize.col('supplementaries.exam.course.id'), 'courseId'],
                [
                    sequelize.col('supplementaries.exam.course.type'),
                    'courseType',
                ],
                [
                    sequelize.col('supplementaries.exam.course.name'),
                    'courseName',
                ],
                [sequelize.col('program.abbreviation'), 'programName'],
            ],
            raw: true,
        });

        // logger.trace(supplyStudents, 'students');

        const students = [
            ...studentsSecondLang,
            ...studentsNonOpenCourse,
            ...studentsOpenCourse,
            ...supplyStudents,
        ];

        // logger.debug(students, 'students');

        const result = countStudentsByProgram(students);

        logger.debug(result);

        return students;
    } catch (error) {
        throw new Error(`Error fetching students: ${error.message}`);
    }
}

// Function to match students with programs and courses
function matchStudentsWithData(students, data) {
    const groupedStudents = students.map((student) => {
        data.forEach((value) => {
            if (
                !student.courseId &&
                value.programId === student.programId &&
                value.semester === student.semester
            ) {
                student.courseSemester = value.semester;
                student.courseName = value.courseName;
                student.courseId = value.courseId;
                student.examId = value.examId;
                student.courseType = value.courseType;
            } else if (student.courseId && !student.examId) {
                if (student.courseId === value.courseId) {
                    student.examId = value.examId;
                    student.courseName = value.courseName;
                    student.courseType = value.courseType;
                    student.courseSemester = value.semester;
                }
            }
        });

        return student;
    });
    // logger.trace(groupedStudents, 'grouped students');
    return groupedStudents;
}

// Function to group students by courseId
/**
 *
 * @param {*} students
 * @type {import('./type.js').NestedStudentArray } NestedStudentArray
 * @returns {NestedStudentArray}
 */
function groupStudentsByCourseId(students, examOrder) {
    const groupedStudents = {};

    students.forEach((student) => {
        const { courseId, courseType, programId } = student;

        if (courseType === 'common' || true) {
            const programCourse = `${programId}-${courseId}`;
            if (!groupedStudents[programCourse]) {
                groupedStudents[programCourse] = [];
            }

            groupedStudents[programCourse].push(student);
        } else {
            if (!groupedStudents[courseId]) {
                groupedStudents[courseId] = [];
            }

            groupedStudents[courseId].push(student);
        }
    });

    // Sorting the nested arrays in descending order based on length
    let sortedGroupedStudents = Object.values(groupedStudents).sort(
        (a, b) => b.length - a.length,
    );

   /*  if (Array.isArray(examOrder)) {
        sortedGroupedStudents = examOrder.flatMap((examId) => {
            const filteredGroups = sortedGroupedStudents.filter(
                (group) => group[0].programId === parseInt(examId, 10),
            );
            return filteredGroups;
        });
    } */

    logger.debug(sortedGroupedStudents, 'grouped students')

    return sortedGroupedStudents;
}

// Main function to execute the code
export default async function getData({
    date,
    timeCode,
    examOrder,
    orderBy = 'rollNumber',
}) {
    try {
        const { nonOpenCourses, openCourses, commonCourse2 } = await fetchExams(
            date,
            timeCode,
        );

        const students = await fetchStudents({
            orderBy,
            nonOpenCourses,
            openCourses,
            commonCourse2,
        });

        const totalStudents = students.length;

        const updateStudents = matchStudentsWithData(students, [
            ...openCourses,
            ...nonOpenCourses,
            ...commonCourse2,
        ]);

        const groupedStudents = groupStudentsByCourseId(
            updateStudents,
            examOrder,
        );

        return [groupedStudents, totalStudents];
    } catch (error) {
        logger.error(error.message);
        return null;
    }
}
// getData(new Date('2023-10-25'));
export { fetchExams, groupStudentsByCourseId };
