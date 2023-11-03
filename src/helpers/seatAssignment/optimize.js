import SeatingArrangement from './algorithm.js';
import { assignSeats } from './assignSeats.js';

async function main() {
    try {
        // Get seat assignment data
        const [roomAssignments, unassignedStudentCount, studentData] =
            await assignSeats({
                date: new Date(),
                fileName: 'optimized',
            });

        // Course IDs of unassigned students
        const courseIds = studentData.map((student) => student[0].courseId);

        // Filter rooms with empty seats
        const roomsWithEmptySeats = roomAssignments.filter(
            (room) => room.unOccupiedSeatsCount > 0,
        );

        let remainingUnassignedStudents = unassignedStudentCount;

        courseIds.forEach((courseId) => {
            // Loop through room assignments
            roomAssignments.forEach((roomAssignment) => {
                let { exams, seatingMatrix } = roomAssignment;

                // Loop through exams in the room
                exams.forEach((exam) => {
                    if (remainingUnassignedStudents <= 0) {
                        return;
                    }

                    // Check if the course of the exam doesn't match the primary course
                    if (exam.courseId !== courseId) {
                        // Create a new seating matrix with seat assignment optimization
                        const newSeatingMatrix = seatingMatrix.map((row) => {
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
                                        exam: null,
                                        regno: null,
                                    };
                                }
                                return seat;
                            });
                        });

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
                            console.error(error.message);
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
                        // Create a list of students to replace
                        let studentsToReplace = seatingMatrix.map((row) => {
                            return row.filter((seat) => {
                                if (
                                    seat.courseId === exam.courseId &&
                                    studentIndex < unassignedStudentCount
                                ) {
                                    studentIndex += 1;
                                    return true;
                                }
                                return false;
                            });
                        });

                        // Create a copy of rooms with empty seats to optimize
                        let roomsToOptimize = [...roomsWithEmptySeats];

                        roomsToOptimize.forEach((roomToOptimize) => {
                            // Create an optimization attempt for the room
                            const optimizationAttempt = new SeatingArrangement({
                                students: [...studentsToReplace],
                                room: roomToOptimize,
                            });

                            try {
                                // Attempt to optimize seat assignments for the room
                                optimizationAttempt.assignSeats();
                            } catch (error) {
                                console.error(error.message);
                            }

                            // Filter students left unassigned after optimization
                            studentsToReplace = optimizationAttempt
                                .getUnsignedStudents()
                                .filter(
                                    (classStudents) => classStudents.length > 0,
                                );
                        });

                        // Check if optimization was successful and update data
                        if (
                            studentsLeftUnassigned.length === 0 &&
                            studentsToReplace.length === 0
                        ) {
                            console.log('Optimization was successful');
                            seatingMatrix = newSeatingMatrix;

                            // Update room assignments with optimized rooms
                            roomsToOptimize.forEach((optimizedRoom) => {
                                roomAssignments.forEach((originalRoom) => {
                                    if (optimizedRoom.id === originalRoom.id)
                                        originalRoom = optimizedRoom;
                                });
                            });
                        } else {
                            console.log('Optimization was unsuccessful');
                        }
                    }
                });
            });
        });

        // Log the final room assignments
        console.log(JSON.stringify(roomAssignments, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
