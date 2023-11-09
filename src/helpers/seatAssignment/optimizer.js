import _ from 'lodash';
import SeatingArrangement from './algorithm.js';

const logger = (message) => {
    console.log(message);
};

function optimizationAttempt(students, room) {
    const seatingOptimizer = new SeatingArrangement({
        students,
        room,
    });

    try {
        seatingOptimizer.assignSeats();
    } catch (error) {
        logger(`Error in optimization Attempt: ${error.message}`);
        return false;
    }

    const studentsLeftUnassigned = seatingOptimizer
        .getUnsignedStudents()
        .filter((classStudents) => classStudents.length > 0);

    if (studentsLeftUnassigned.length > 0) {
        return false;
    }
    return true;
}

function firstTryToOptimization(
    exam,
    exams,
    seatingMatrix,
    totalStudentsCount,
    studentsData,
) {
    // console.log(JSON.stringify(studentsData, null, 2));
    // console.log('studentsData', studentsData);
    // console.log('totalStudentsCount', totalStudentsCount);

    /* const currentExam = exams.filter(
        (e) => e.courseId === studentsData[0].courseId,
    ); */
    const currentExam = exam;

    // console.log('exam : ', exam);
    // let studentIndex = 0;

    const newSeatingMatrix = seatingMatrix.map((row) => {
        if (totalStudentsCount <= 0) {
            return row;
        }
        return row.map((seat) => {
            if (totalStudentsCount <= 0) {
                return seat;
            }
            if (seat.courseId === currentExam.courseId) {
                totalStudentsCount -= 1;

                currentExam.examines = currentExam.examines.filter((x) => {
                    return x !== seat.id;
                });
                /*  const result = optimizationAttempt(
                    [studentsData[studentIndex]],
                    {
                        seatingMatrix: seatingMatrix[],
                        exams,
                    },
                ); */

                // if (result) studentIndex += 1;

                return {
                    occupied: false,
                };
            }
            return seat;
        });
    });

    /* console.log(
        'new seating matrix: ',
        JSON.stringify(newSeatingMatrix, null, 2),
    ); */

    // console.log('currentExam: ', JSON.stringify(currentExam, null, 2));

    exams = exams.map((x) => {
        if (x.courseId === currentExam.courseId) {
            console.log(x.courseId === currentExam.courseId);
            return currentExam;
        }
        return x;
    });

    console.log('before: ', JSON.stringify(exams, null, 2));

    console.log('remaing students: ', totalStudentsCount);

    /*  console.log(
        'students in course: ',
        JSON.stringify(studentsInCourse, null, 2),
    ); */

    // studentsInCourseCount = studentsInCourse.length;

    const assignedStudentCount = studentsData.length - totalStudentsCount;

    const newStudents = studentsData.splice(0, assignedStudentCount);

    console.log('new students: ', newStudents.length);
    console.log('studentData: ', studentsData.length);

    if (!newStudents.length) {
        console.log('first optimization unsuccessful');

        return [false, null, null, assignedStudentCount];
    }

    const result = optimizationAttempt([newStudents], {
        seatingMatrix: newSeatingMatrix,
        exams,
    });

    if (!result) {
        console.log('first optimization unsuccessful');

        return [false, null, null, assignedStudentCount];
    }

    /*  console.log(
        'new seating matrix: ',
        JSON.stringify(newSeatingMatrix, null, 2),
    ); */
    console.log('after: ', JSON.stringify(exams, null, 2));

    console.log('first optimization successful');
    return [true, newSeatingMatrix, exams, assignedStudentCount];
}

function secondTryToOptimize(
    seatingMatrix,
    exam,
    assignedStudentsCount,
    roomsToOptimize,
) {
    console.log('assigned students count ', assignedStudentsCount);
    let studentIndex = 0;
    let studentsToReplace = seatingMatrix.map((row) => {
        return row
            .map((seat) => {
                if (
                    seat.courseId === exam.courseId &&
                    studentIndex < assignedStudentsCount
                ) {
                    studentIndex += 1;
                    seat.programId = exam.id;
                    seat.programName = exam.name;
                    seat.semester = exam.semester;
                    return seat;
                }
                // console.log(seat.courseId, exam.courseId);
                return {};
            })
            .filter((seat) => Object.keys(seat).length > 0);
    });

    // console.log('students to replace : ', studentsToReplace);

    let studentsAlreadyAssigned = [];

    roomsToOptimize.forEach((roomToOptimize) => {
        const studentsToAssign = studentsToReplace.filter(
            (student) => !studentsAlreadyAssigned.includes(student),
        );

        if (studentsToAssign.length === 0) {
            return;
        }

        const result = optimizationAttempt(studentsToAssign, roomToOptimize);

        if (result) {
            studentsAlreadyAssigned =
                studentsAlreadyAssigned.concat(studentsToAssign);
        }
    });

    if (studentsAlreadyAssigned.length === studentsToReplace.length) {
        console.log('second optimization successful');

        return true;
    }
    console.log('second optimization unsuccessful');

    return false;
}

async function main(roomAssignments, unassignedStudentCount, studentData) {
    // console.log(JSON.stringify(studentData, null, 2));
    try {
        if (
            roomAssignments.length <= 0 ||
            unassignedStudentCount <= 0 ||
            studentData.length <= 0
        ) {
            console.warn('Lack necessary data to start optimization!');
            return unassignedStudentCount;
        }

        let roomAssignmentsCopy = _.cloneDeep(roomAssignments);

        // Iterate through course IDs
        studentData.forEach((students, studentIndex) => {
            let studentsCopy = _.cloneDeep(students);
            let studentsInCourseCount = studentsCopy.length;

            // Filter rooms with empty seats
            const roomsWithEmptySeats = roomAssignmentsCopy.filter(
                (room) => room.unOccupiedSeatsCount > 0,
            );

            if (roomsWithEmptySeats.length <= 0) {
                console.warn('Unable to optimize due to lack of empty seats');
                return unassignedStudentCount;
            }

            roomAssignmentsCopy.forEach((roomAssignment, index) => {
                let { exams, seatingMatrix } = roomAssignment;

                exams.forEach((exam) => {
                    if (studentsInCourseCount <= 0) {
                        return;
                    }
                    if (students.length === 0) return;

                    if (exam.courseId !== students[0]?.courseId) {
                        const [
                            result,
                            newSeatingMatrix,
                            newExams,
                            assignedStudentsCount,
                        ] = firstTryToOptimization(
                            exam,
                            [...exams],
                            seatingMatrix,
                            studentsInCourseCount,
                            studentsCopy,
                        );

                        if (!result) {
                            studentsCopy = _.cloneDeep(students);
                            return;
                        }

                        let roomsToOptimize = _.cloneDeep(roomsWithEmptySeats);

                        const opt2 = secondTryToOptimize(
                            seatingMatrix,
                            exam,
                            assignedStudentsCount,
                            roomsToOptimize,
                        );

                        if (opt2) {
                            logger('Optimization was successful');
                            students = _.cloneDeep(studentsCopy);

                            studentData[studentIndex] = students;

                            studentsInCourseCount = studentsCopy.length;

                            roomAssignment.seatingMatrix = newSeatingMatrix;
                            roomAssignment.exams = newExams;

                            /* console.log(
                                'before: ',
                                JSON.stringify(
                                    roomAssignments[index].exams,
                                    null,
                                    2,
                                ),
                            ); */

                            roomAssignments[index] = roomAssignment;

                            /*  console.log(
                                'after: ',
                                JSON.stringify(
                                    roomAssignments[index].exams,
                                    null,
                                    2,
                                ),
                            ); */

                            roomsToOptimize.forEach((optimizedRoom) => {
                                roomAssignments.forEach(
                                    (originalRoom, roomIndex) => {
                                        if (
                                            optimizedRoom.id === originalRoom.id
                                        )
                                            roomAssignments[roomIndex] =
                                                optimizedRoom;
                                    },
                                );
                            });
                        } else {
                            studentsCopy = _.cloneDeep(students);
                            studentsInCourseCount = students.length;
                            roomAssignmentsCopy = _.cloneDeep(roomAssignments);
                            logger('Optimization was unsuccessful');
                        }
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }

    const flatArray = studentData.flat();
    const numberOfStudents = flatArray.length;

    return numberOfStudents;
}

export default main;
