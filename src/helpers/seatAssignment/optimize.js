// main.js

import _ from 'lodash';
import SeatingArrangement from './algorithm.js';
// import { assignSeats } from './assignSeats.js';

// Configuration
/* const config = {
    date: new Date(),
    fileName: 'optimized',
    primaryCourseIndex: 0,
}; */

/**
 * Main function for the seat assignment optimization process.
 */
async function main(roomAssignments, unassignedStudentCount, studentData) {
    try {
        // Get seat assignment data
        /*   const [roomAssignments, unassignedStudentCount, studentData] =
            await assignSeats(config); */

        if (
            roomAssignments.length <= 0 ||
            unassignedStudentCount <= 0 ||
            studentData.length <= 0
        ) {
            console.warn('Lack necessary data to start optimization!');
            return unassignedStudentCount;
        }

        let roomAssignmentsCopy = _.cloneDeep(roomAssignments);

        // Extract course IDs from student data
        const courseIds = studentData.map((student) => student[0].courseId);

        if (!courseIds.length) {
            console.warn("Can't retrieve course ids of unassigned students");
        }

        // Filter rooms with empty seats
        const roomsWithEmptySeats = roomAssignmentsCopy.filter(
            (room) => room.unOccupiedSeatsCount > 0,
        );

        if (roomsWithEmptySeats.length <= 0) {
            console.warn('Unable to optimize due to lack of empty seats');
            return unassignedStudentCount;
        }

        let remainingUnassignedStudents = unassignedStudentCount;

        // Define a logger function for better logging
        const logger = (message) => {
            console.log(message);
        };

        // Iterate through course IDs
        courseIds.forEach((courseId) => {
            // Iterate through room assignments
            roomAssignmentsCopy.forEach((roomAssignment) => {
                let { exams, seatingMatrix } = roomAssignment;

                // Iterate through exams in the room
                [...exams].forEach((exam) => {
                    if (remainingUnassignedStudents <= 0) {
                        return;
                    }

                    // Check if the course of the exam doesn't match the primary course
                    if (exam.courseId !== courseId) {
                        // Create a new seating matrix with seat assignment optimization
                        const newSeatingMatrix = [...seatingMatrix].map(
                            (row) => {
                                if (remainingUnassignedStudents <= 0) {
                                    return row;
                                }
                                return row.map((seat) => {
                                    if (remainingUnassignedStudents <= 0) {
                                        return seat;
                                    }
                                    if (seat.courseId === courseId) {
                                        remainingUnassignedStudents -= 1;
                                        return {
                                            occupied: false,
                                        };
                                    }
                                    return seat;
                                });
                            },
                        );

                        // Create a seating optimizer
                        const seatingOptimizer = new SeatingArrangement({
                            students: [...studentData],
                            room: {
                                seatingMatrix: newSeatingMatrix,
                                exams: [...exams],
                            },
                        });

                        try {
                            // Attempt to assign seats using the optimizer
                            seatingOptimizer.assignSeats();
                        } catch (error) {
                            logger(`Error: ${error.message}`);
                        }

                        // Filter students who couldn't be assigned seats
                        const studentsLeftUnassigned = seatingOptimizer
                            .getUnsignedStudents()
                            .filter(
                                (classStudents) => classStudents.length > 0,
                            );

                        if (studentsLeftUnassigned.length > 0) {
                            return; // Unable to optimize this room
                        }

                        let studentIndex = 0;
                        let studentsToReplace = [...seatingMatrix].map(
                            (row) => {
                                return row
                                    .map((seat) => {
                                        if (
                                            seat.courseId === exam.courseId &&
                                            studentIndex <
                                                unassignedStudentCount
                                        ) {
                                            // logger(JSON.stringify(exam, null, 2));
                                            studentIndex += 1;
                                            seat.programId = exam.id;
                                            seat.programName = exam.name;
                                            seat.semester = exam.semester;
                                            return seat;
                                        }
                                        return {}; // Return an empty object for seats that should be filtered out
                                    })
                                    .filter(
                                        (seat) => Object.keys(seat).length > 0,
                                    ); // Filter out the empty objects in each row
                            },
                        );

                        // Create a copy of rooms with empty seats to optimize
                        let roomsToOptimize = [...roomsWithEmptySeats];
                        let studentsAlreadyAssigned = [];

                        // Iterate through rooms to optimize
                        roomsToOptimize.forEach((roomToOptimize) => {
                            // Filter students that haven't been assigned yet
                            const studentsToAssign = studentsToReplace.filter(
                                (student) =>
                                    !studentsAlreadyAssigned.includes(student),
                            );

                            if (studentsToAssign.length === 0) {
                                remainingUnassignedStudents =
                                    unassignedStudentCount;
                                return; // No more unassigned students to optimize for this room
                            }

                            // Create an optimization attempt
                            const optimizationAttempt = new SeatingArrangement({
                                students: studentsToAssign, // Assign only unassigned students
                                room: roomToOptimize,
                            });

                            try {
                                // Attempt to optimize seat assignments for the room
                                optimizationAttempt.assignSeats();
                            } catch (error) {
                                logger(`Error: ${error.message}`);
                            }

                            // Filter students left unassigned after optimization
                            studentsToReplace = studentsToReplace.filter(
                                (student) =>
                                    !studentsAlreadyAssigned.includes(student),
                            );
                            studentsToReplace = optimizationAttempt
                                .getUnsignedStudents()
                                .filter(
                                    (classStudents) => classStudents.length > 0,
                                );

                            // Update the list of students who have been assigned
                            studentsAlreadyAssigned =
                                studentsAlreadyAssigned.concat(
                                    studentsToAssign,
                                );
                        });

                        // Check if optimization was successful and update data
                        if (
                            studentsLeftUnassigned.length === 0 &&
                            studentsToReplace.length === 0
                        ) {
                            logger('Optimization was successful');
                            /*  roomAssignment.seatingMatrix = newSeatingMatrix;

                            // Update room assignments with optimized rooms
                            roomsToOptimize.forEach((optimizedRoom) => {
                                roomAssignments.forEach((originalRoom) => {
                                    if (optimizedRoom.id === originalRoom.id)
                                        originalRoom = optimizedRoom;
                                });
                            }); */
                        } else {
                            remainingUnassignedStudents =
                                unassignedStudentCount;
                            roomAssignmentsCopy = _.cloneDeep(roomAssignments);
                            logger('Optimization was unsuccessful');
                        }
                    }
                });
            });
        });

        // Log the final room assignments
        // logger(JSON.stringify(roomAssignments, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
    return unassignedStudentCount;
}

// main();

export default main;
