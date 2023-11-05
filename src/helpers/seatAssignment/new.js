import _ from 'lodash';
import SeatingArrangement from './algorithm.js';

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

        const logger = (message) => {
            console.log(message);
        };

        // Iterate through course IDs
        studentData.forEach((courseData, courseIndex) => {
            let studentsInCourse = _.cloneDeep(courseData);
            let studentsInCourseCount = studentsInCourse.length;

            // Filter rooms with empty seats
            const roomsWithEmptySeats = roomAssignmentsCopy.filter(
                (room) => room.unOccupiedSeatsCount > 0,
            );

            console.log('length = ', roomsWithEmptySeats.length);

            if (roomsWithEmptySeats.length <= 0) {
                console.warn('Unable to optimize due to lack of empty seats');
                return unassignedStudentCount;
            }

            roomAssignmentsCopy.forEach((roomAssignment, index) => {
                let { exams, seatingMatrix } = roomAssignment;

                exams.forEach((exam, examIndex) => {
                    if (studentsInCourseCount <= 0) {
                        return;
                    }
                    if (courseData.length === 0) return;

                    let newExams = [...exams];

                    const currentExam = exams.filter(
                        (e) => e.courseId === courseData[0].courseId,
                    );

                    if (exam.courseId !== courseData[0]?.courseId) {
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

                                    currentExam[0].examines =
                                        currentExam[0].examines.filter((x) => {
                                            return x !== seat.id;
                                        });

                                    return {
                                        occupied: false,
                                    };
                                }
                                return seat;
                            });
                        });

                        newExams = newExams.map((x) => {
                            if (x.courseId === courseData[0].courseId)
                                return currentExam[0];
                            return x;
                        });

                        studentsInCourseCount = studentsInCourse.length;

                        // logger(JSON.stringify(newExams, null, 2));

                        const seatingOptimizer = new SeatingArrangement({
                            students: [studentsInCourse],
                            room: {
                                seatingMatrix: newSeatingMatrix,
                                exams,
                            },
                        });

                        try {
                            seatingOptimizer.assignSeats();
                        } catch (error) {
                            logger(`Error in 1: ${error.message}`);
                        }

                        const studentsLeftUnassigned = seatingOptimizer
                            .getUnsignedStudents()
                            .filter(
                                (classStudents) => classStudents.length > 0,
                            );

                        /* console.log('new seatingmatrix:');
                        logger(JSON.stringify(exams, null, 2)); */

                        if (studentsLeftUnassigned.length > 0) {
                            studentsInCourse = _.cloneDeep(courseData);
                            return;
                        }

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

                        // logger(JSON.stringify(studentsToReplace, null, 2));

                        /* console.log('roomsWithEmptySeats: ');
                        logger(JSON.stringify(roomsWithEmptySeats, null, 2)); */

                        let roomsToOptimize = _.cloneDeep(roomsWithEmptySeats);
                        let studentsAlreadyAssigned = [];

                        roomsToOptimize.forEach((roomToOptimize) => {
                            const studentsToAssign = studentsToReplace.filter(
                                (student) =>
                                    !studentsAlreadyAssigned.includes(student),
                            );

                            if (studentsToAssign.length === 0) {
                                return;
                            }

                            const optimizationAttempt = new SeatingArrangement({
                                students: studentsToAssign,
                                room: roomToOptimize,
                            });

                            try {
                                optimizationAttempt.assignSeats();
                            } catch (error) {
                                logger(`Error in 2: ${error.message}`);
                            }

                            studentsToReplace = studentsToReplace.filter(
                                (student) =>
                                    !studentsAlreadyAssigned.includes(student),
                            );
                            studentsToReplace = optimizationAttempt
                                .getUnsignedStudents()
                                .filter(
                                    (classStudents) => classStudents.length > 0,
                                );

                            studentsAlreadyAssigned =
                                studentsAlreadyAssigned.concat(
                                    studentsToAssign,
                                );
                        });
                        logger(JSON.stringify(roomsToOptimize, null, 2));

                        if (
                            studentsLeftUnassigned.length === 0 &&
                            studentsToReplace.length === 0
                        ) {
                            logger('Optimization was successful');
                            courseData = _.cloneDeep(studentsInCourse);

                            roomAssignment.seatingMatrix = newSeatingMatrix;
                            roomAssignment.exams = newExams;

                            roomAssignments[index] = roomAssignment;

                            /* console.log('roomsToOptimize:');
                            logger(
                                JSON.stringify(roomsToOptimize, null, 2),
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
