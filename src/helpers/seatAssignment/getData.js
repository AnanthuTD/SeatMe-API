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

async function fetchBannedStudentIds() {
    const bannedStudents = await models.bannedStudent.findAll({
        attributes: ['studentId'],
    });
    return bannedStudents.map((bannedStudent) => bannedStudent.studentId);
}

function getCombinedCourses(courses, keyMapping) {
    return courses
        .map((course) => {
            const key = keyMapping(course.semester);
            return key
                ? { [key]: course.courseId, semester: course.semester }
                : null;
        })
        .filter(Boolean);
}

function getSecondLangKey(semester) {
    return `secondLang_${semester}`;
}

async function fetchStudentsByCourses(courses, bannedStudentsId, orderBy) {
    return models.student.findAll({
        where: {
            [Op.or]: courses,
            id: {
                [Op.notIn]: bannedStudentsId,
            },
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
}

async function fetchSupplementaryStudents(bannedStudentsId, exams, orderBy) {
    return models.student.findAll({
        where: {
            id: {
                [Op.notIn]: bannedStudentsId,
            },
        },
        include: [
            {
                model: models.supplementary,
                where: {
                    exam_id: {
                        [Op.in]: exams,
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
            [sequelize.col('supplementaries.exam.course.type'), 'courseType'],
            [sequelize.col('supplementaries.exam.course.name'), 'courseName'],
            [sequelize.col('program.abbreviation'), 'programName'],
        ],
        raw: true,
    });
}

async function fetchSecondLangStudents(
    combinedCourses,
    bannedStudentsId,
    orderBy,
) {
    const secondLang = await Promise.all(
        combinedCourses.map(async (course) => {
            const students = await models.student.findAll({
                where: {
                    ...course,
                    id: {
                        [Op.notIn]: bannedStudentsId,
                    },
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

            const secondLangKey = Object.keys(course).find((key) =>
                key.startsWith('secondLang_'),
            );
            students.forEach((student) => {
                student.courseId = course[secondLangKey];
            });

            return students;
        }),
    );

    return [].concat(...secondLang);
}

async function fetchStudents({
    nonOpenCourses,
    openCourses,
    commonCourse2,
    orderBy = '',
}) {
    try {
        const bannedStudentsId = await fetchBannedStudentIds();

        const combinedNonOpenCourses = getCombinedCourses(
            nonOpenCourses,
            () => 'programId',
        );
        const combinedOpenCourses = getCombinedCourses(
            openCourses,
            () => 'openCourseId',
        );
        const combinedCommonCourse2 = getCombinedCourses(
            commonCourse2,
            getSecondLangKey,
        );

        const studentsOpenCourse = await fetchStudentsByCourses(
            combinedOpenCourses,
            bannedStudentsId,
            orderBy,
        );
        const studentsNonOpenCourse = await fetchStudentsByCourses(
            combinedNonOpenCourses,
            bannedStudentsId,
            orderBy,
        );
        const studentsSecondLang = await fetchSecondLangStudents(
            combinedCommonCourse2,
            bannedStudentsId,
            orderBy,
        );

        const examIds = [
            ...nonOpenCourses.map((value) => value.examId),
            ...openCourses.map((value) => value.examId),
            ...commonCourse2.map((value) => value.examId),
        ];
        const supplyStudents = await fetchSupplementaryStudents(
            bannedStudentsId,
            examIds,
            orderBy,
        );

        return [
            ...studentsSecondLang,
            ...studentsNonOpenCourse,
            ...studentsOpenCourse,
            ...supplyStudents,
        ];
    } catch (error) {
        logger.debug(error);
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
            // TODO: sorting all courses based on program
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

    logger.debug(examOrder, 'examOrder');
    if (Array.isArray(examOrder)) {
        sortedGroupedStudents = examOrder.flatMap((programId) => {
            const filteredGroups = sortedGroupedStudents.filter(
                (group) => group[0].programId === parseInt(programId, 10),
            );
            return filteredGroups;
        });
    }

    // logger.debug(sortedGroupedStudents, 'grouped students')

    return sortedGroupedStudents;
}

// Main function to execute the code
export default async function getData({
    date,
    timeCode,
    examOrder,
    orderBy = 'rollNumber',
}) {
    console.log('examOrder getData: ', examOrder);
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
