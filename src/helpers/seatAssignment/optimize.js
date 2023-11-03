import SeatingArrangement from './algorithm.js';
import { assignSeats } from './assignSeats.js';

async function main() {
    try {
        const [result, unassignedStudents, students] = await assignSeats({
            date: new Date(),
            fileName: 'optimized',
        });

        // console.warn('unassigned students: ', unassignedStudents);
        // console.log(JSON.stringify(students, null, 2));
        // console.log(JSON.stringify(result, null, 2));

        const courses = students.map((student) => student[0].courseId);

        // console.log(courses);

        const roomsHavingEmptySeats = result.filter(
            (rooms) => rooms.unOccupiedSeatsCount > 0,
        );

        // console.log('rooms having empty: ', roomsHavingEmptySeats.length);
        // console.log(JSON.stringify(roomsHavingEmptySeats, null, 2));

        let count = unassignedStudents;

        result.forEach((rooms) => {
            let { exams, seatingMatrix } = rooms;

            exams.forEach((exam) => {
                if (count <= 0) {
                    return;
                }

                if (exam.courseId !== courses[0]) {
                    const newSeatingMatrix = seatingMatrix.map((row) => {
                        if (count <= 0) {
                            return row;
                        }
                        return row.map((seat) => {
                            if (count <= 0) {
                                return seat;
                            }
                            if (seat.courseId === courses[0]) {
                                count -= 1;
                                return {
                                    occupied: false,
                                    exam: null,
                                    regno: null,
                                };
                            }
                            return seat;
                        });
                    });

                    const tryAssign = new SeatingArrangement({
                        students: [...students],
                        room: { seatingMatrix: newSeatingMatrix, exams: [] },
                    });

                    // console.log(JSON.stringify(newSeatingMatrix, null, 2));
                    try {
                        tryAssign.assignSeats();
                    } catch (error) {
                        console.error(error.message);
                    }
                    let balanceStudents = tryAssign
                        .getUnsignedStudents()
                        .filter((classStudents) => classStudents.length > 0);

                    if (balanceStudents.length > 0) {
                        return;
                    }

                    let i = 0;
                    let studentsToReplace = seatingMatrix.map((row) => {
                        return row.filter((seat) => {
                            if (
                                seat.courseId === exam.courseId &&
                                i < unassignedStudents
                            ) {
                                i += 1;
                                return true;
                            }
                            return false;
                        });
                    });

                    let tempRoomsHavingEmptySeats = [...roomsHavingEmptySeats];

                    tempRoomsHavingEmptySeats.forEach((room) => {
                        const tryAssign1 = new SeatingArrangement({
                            students: [...studentsToReplace],
                            room,
                        });

                        try {
                            tryAssign1.assignSeats();
                        } catch (error) {
                            console.error(error.message);
                        }
                        studentsToReplace = tryAssign1
                            .getUnsignedStudents()
                            .filter(
                                (classStudents) => classStudents.length > 0,
                            );
                        /*   console.log(
                            JSON.stringify(roomsHavingEmptySeats, null, 2),
                        ); */
                    });
                    /*   console.log(
                        JSON.stringify(tempRoomsHavingEmptySeats, null, 2),
                    ); */

                    if (
                        balanceStudents.length === 0 &&
                        studentsToReplace.length === 0
                    ) {
                        console.log('Optimization was successful');

                        seatingMatrix = newSeatingMatrix;

                        /*  tempRoomsHavingEmptySeats.forEach((room1) => {
                            result.forEach((room2) => {
                                if (room1.id === room2.id) room2 = room1;
                            });
                        }); */
                    } else console.log('Optimization was unsuccessful');
                }
            });
        });
        console.log(JSON.stringify(result, null, 2));
        // console.log('Optimization was successful');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
