import _ from 'lodash';
import SeatingArrangement from './algorithm.js';

const logger = (message) => {
    console.log(message);
};

function optimizationAttempt({ students, room }) {
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
        .filter((classStudents) => classStudents.length);

    if (studentsLeftUnassigned.length) {
        return false;
    }
    return room;
}

function firstTryToOptimization(
    exam,
    exams,
    seatingMatrix,
    studentsData,
    roomsWithEmptySeats,
) {
    console.log('hi', studentsData.length);
    console.log('selected exam to replace', exam.courseId);

    let newSeatingMatrix = _.cloneDeep(seatingMatrix);

    newSeatingMatrix.forEach((row, rowIndex) => {
        if (!studentsData.length) {
            return;
        }
        row.forEach((seat, colIndex) => {
            if (!studentsData.length) {
                return;
            }
            if (seat.courseId === exam.courseId) {
                newSeatingMatrix[rowIndex][colIndex] = {
                    occupied: false,
                };

                const room = { seatingMatrix: newSeatingMatrix, exams };
                const result = optimizationAttempt({
                    students: [[studentsData[0]]],
                    room,
                });

                console.log(
                    'unassigned student: ',
                    studentsData[0].id,
                    studentsData[0].courseId,
                );

                if (result) {
                    exams = result.exams;
                    newSeatingMatrix = result.seatingMatrix;
                    console.log('stage 2');
                    let flag = false;

                    roomsWithEmptySeats.forEach((roomToOptimize) => {
                        if (flag) return;
                        const result2 = optimizationAttempt({
                            students: [[seat]],
                            room: roomToOptimize,
                        });
                        if (result2) {
                            flag = true;
                          /*   if (studentsData[0].id === 500030984892)
                                console.log(
                                    JSON.stringify(roomToOptimize, null, 2),
                                ); */
                        }
                    });
                    // 100010084889 AB2CDE127
                    if (!flag) {
                        console.log('stage 2 failed!');
                        newSeatingMatrix[rowIndex][colIndex] = seat;
                        return;
                    }

                    console.log(seat.id, seat.courseId);

                    console.log('optimization successful');

                    studentsData.splice(0, 1);

                    exam.examines = exam.examines.filter((x) => {
                        return x !== seat.id;
                    });
                } else newSeatingMatrix[rowIndex][colIndex] = seat;
            }
        });
    });

    exams = exams.filter((x) => {
        return x.examines.length;
    });

    return [true, newSeatingMatrix, exams, studentsData, roomsWithEmptySeats];
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
                // if (index !== 0) return;
                console.log('roomIndex: ', index);
                let { exams, seatingMatrix } = roomAssignment;

                exams.forEach((exam) => {
                    if (studentsInCourseCount <= 0) {
                        console.log('no students left in course');
                        return;
                    }
                    if (students.length === 0) return;

                    if (exam.courseId !== students[0]?.courseId) {
                        const [
                            status,
                            newSeatingMatrix,
                            newExams,
                            studentDataReturned,
                        ] = firstTryToOptimization(
                            exam,
                            [...exams],
                            seatingMatrix,
                            studentsCopy,
                            roomsWithEmptySeats,
                        );

                        if (!status) return;

                        studentsCopy = studentDataReturned;

                        students = _.cloneDeep(studentDataReturned);

                        studentData[studentIndex] = students;

                        studentsInCourseCount = studentDataReturned.length;

                        roomAssignment.seatingMatrix = newSeatingMatrix;
                        roomAssignment.exams = newExams;

                        exams = newExams;
                        seatingMatrix = newSeatingMatrix;

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

                        roomsWithEmptySeats.forEach((optimizedRoom) => {
                            roomAssignments.forEach(
                                (originalRoom, roomIndex) => {
                                    if (optimizedRoom.id === originalRoom.id)
                                        roomAssignments[roomIndex] =
                                            optimizedRoom;
                                },
                            );
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
    console.log(JSON.stringify(studentData.flat(), null, 2));
    const flatArray = studentData.flat();
    const numberOfStudents = flatArray.length;

    return numberOfStudents;
}

export default main;
