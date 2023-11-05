import _ from 'lodash';
import SeatingArrangement from './algorithm.js';

const logger = (message) => {
    console.log(message);
};

function optimizationAttempt(students, room) {
    console.log(JSON.stringify(room, null, 2));

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
    exams,
    courseData,
    seatingMatrix,
    studentsInCourseCount,
    studentsInCourse,
) {
    const currentExam = exams.filter(
        (e) => e.courseId === courseData[0].courseId,
    );

    const newSeatingMatrix = seatingMatrix.map((row) => {
        if (studentsInCourseCount <= 0) {
            return row;
        }
        return row.map((seat) => {
            if (studentsInCourseCount <= 0) {
                return seat;
            }
            if (seat.courseId === courseData[0].courseId) {
                studentsInCourseCount -= 1;

                currentExam[0].examines = currentExam[0].examines.filter(
                    (x) => {
                        return x !== seat.id;
                    },
                );

                return {
                    occupied: false,
                };
            }
            return seat;
        });
    });

    exams = exams.map((x) => {
        if (x.courseId === courseData[0].courseId) return currentExam[0];
        return x;
    });

    studentsInCourseCount = studentsInCourse.length;

    const result = optimizationAttempt([studentsInCourse], {
        seatingMatrix: newSeatingMatrix,
        exams,
    });

    if (!result) {
        studentsInCourse = _.cloneDeep(courseData);
        return [false, null, null];
    }
    return [true, newSeatingMatrix, exams];
}

function secondTryToOptimize(
    seatingMatrix,
    exam,
    unassignedStudentCount,
    roomsWithEmptySeats,
    roomsToOptimize,
) {
    let studentIndex = 0;
    let studentsToReplace = seatingMatrix.map((row) => {
        return row
            .map((seat) => {
                if (
                    seat.courseId === exam.courseId &&
                    studentIndex < unassignedStudentCount
                ) {
                    studentIndex += 1;
                    seat.programId = exam.id;
                    seat.programName = exam.name;
                    seat.semester = exam.semester;
                    return seat;
                }
                return {};
            })
            .filter((seat) => Object.keys(seat).length > 0);
    });

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
        return true;
    }
    return false;
}

async function main(roomAssignments, unassignedStudentCount, studentData) {
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
        studentData.forEach((courseData) => {
            let studentsInCourse = _.cloneDeep(courseData);
            let studentsInCourseCount = studentsInCourse.length;

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
                    if (courseData.length === 0) return;

                    if (exam.courseId !== courseData[0]?.courseId) {
                        const [result, newSeatingMatrix, newExams] =
                            firstTryToOptimization(
                                [...exams],
                                courseData,
                                seatingMatrix,
                                studentsInCourseCount,
                                studentsInCourse,
                            );

                        if (!result) return;

                        let roomsToOptimize = _.cloneDeep(roomsWithEmptySeats);

                        const opt2 = secondTryToOptimize(
                            seatingMatrix,
                            exam,
                            unassignedStudentCount,
                            roomsWithEmptySeats,
                            roomsToOptimize,
                        );

                        if (opt2) {
                            logger('Optimization was successful');
                            courseData = _.cloneDeep(studentsInCourse);

                            roomAssignment.seatingMatrix = newSeatingMatrix;
                            roomAssignment.exams = newExams;

                            roomAssignments[index] = roomAssignment;

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
                            studentsInCourse = _.cloneDeep(courseData);
                            studentsInCourseCount = courseData.length;
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
    return unassignedStudentCount;
}

export default main;
