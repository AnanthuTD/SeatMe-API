import _ from 'lodash';
import SeatingArrangement from './algorithm.js';

function optimizationAttempt({ students, room, examType }) {
    const seatingOptimizer = new SeatingArrangement({
        students,
        room,
        examType,
    });

    try {
        seatingOptimizer.assignSeats();
    } catch (error) {
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

function firstTryToOptimization({
    selectedCourseForReplacement, // courseId
    selectedProgramForReplacement, // programId
    exams,
    seatingMatrix,
    studentsData,
    roomsWithEmptySeats,
    examType,
    isCommonCourse,
}) {
    let newSeatingMatrix = _.cloneDeep(seatingMatrix);
    const reassignedStudents = [];

    newSeatingMatrix.forEach((row, rowIndex) => {
        if (!studentsData.length) {
            return;
        }
        row.forEach((seat, colIndex) => {
            if (!studentsData.length) {
                return;
            }
            if (
                isCommonCourse
                    ? seat.programId === selectedProgramForReplacement
                    : seat.courseId === selectedCourseForReplacement
            ) {
                newSeatingMatrix[rowIndex][colIndex] = {
                    occupied: false,
                };

                const room = { seatingMatrix: newSeatingMatrix, exams };
                const result = optimizationAttempt({
                    students: [[studentsData[0]]],
                    room,
                    examType,
                });

                if (result) {
                    exams = result.exams;
                    newSeatingMatrix = result.seatingMatrix;

                    let flag = false;

                    roomsWithEmptySeats.forEach((roomToOptimize) => {
                        if (flag) return;
                        const result2 = optimizationAttempt({
                            students: [[seat]],
                            room: roomToOptimize,
                            examType,
                        });
                        if (result2) {
                            flag = true;
                        }
                    });

                    if (!flag) {
                        newSeatingMatrix[rowIndex][colIndex] = seat;
                        return;
                    }

                    studentsData.splice(0, 1);

                    reassignedStudents.push(seat.id);
                } else newSeatingMatrix[rowIndex][colIndex] = seat;
            }
        });
    });

    exams = exams.filter((x) => {
        return x.examines.length;
    });

    exams = exams.map((x) => {
        x.examines = (
            isCommonCourse
                ? x.programId === selectedProgramForReplacement
                : x.courseId === selectedCourseForReplacement
        )
            ? x.examines.filter(
                  (studentId) => !reassignedStudents.includes(studentId),
              )
            : x.examines;

        return x;
    });

    return [newSeatingMatrix, exams, studentsData, roomsWithEmptySeats];
}

async function main(
    rooms,
    unassignedStudentCount,
    unassignedStudentsData,
    examType,
) {
    try {
        if (
            rooms.length <= 0 ||
            unassignedStudentCount <= 0 ||
            unassignedStudentsData.length <= 0
        ) {
            console.warn('Lack necessary data to start optimization!');
            return unassignedStudentCount;
        }

        // let roomAssignmentsCopy = _.cloneDeep(rooms);

        // Iterate through course IDs
        unassignedStudentsData.forEach((students, studentIndex) => {
            let studentsCopy = _.cloneDeep(students);
            let studentsInCourseCount = studentsCopy.length;

            // Filter rooms with empty seats
            const roomsWithEmptySeats = rooms.filter(
                (room) => room.unOccupiedSeatsCount > 0,
            );

            if (roomsWithEmptySeats.length <= 0) {
                console.warn('Unable to optimize due to lack of empty seats');
                return unassignedStudentCount;
            }

            rooms.forEach((room) => {
                let { exams, seatingMatrix } = room;

                exams.forEach((exam) => {
                    if (studentsInCourseCount <= 0) {
                        return;
                    }
                    if (students.length === 0) return;

                    const isCommonCourse = exam.courseType === 'common';

                    if (
                        isCommonCourse
                            ? exam.programId !== students[0]?.programId
                            : exam.courseId !== students[0]?.courseId
                    ) {
                        const [
                            newSeatingMatrix,
                            newExams,
                            studentDataReturned,
                        ] = firstTryToOptimization({
                            selectedCourseForReplacement: exam.courseId,
                            selectedProgramForReplacement: exam.programId,
                            exams: [...exams],
                            seatingMatrix,
                            studentsData: studentsCopy,
                            roomsWithEmptySeats,
                            examType,
                            isCommonCourse,
                        });

                        studentsCopy = studentDataReturned;

                        students = _.cloneDeep(studentDataReturned);

                        unassignedStudentsData[studentIndex] = students;

                        studentsInCourseCount = studentDataReturned.length;

                        room.seatingMatrix = newSeatingMatrix;
                        room.exams = newExams;

                        exams = newExams;
                        seatingMatrix = newSeatingMatrix;

                        // rooms[index] = room;

                        roomsWithEmptySeats.forEach((optimizedRoom) => {
                            rooms.forEach((originalRoom, roomIndex) => {
                                if (optimizedRoom.id === originalRoom.id)
                                    rooms[roomIndex] = optimizedRoom;
                            });
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }

    return rooms;
}

export default main;
