import _ from 'lodash';
import findRepeatingRegNos from './findRepeatingStudents.js';
import getData from './getData.js';
// import generateSeatingMatrixHTML from './htmlSeatingMatrix.js';
import seatCount from './seatCount.js';
import generateSeatingMatrix from './seatingMatrix.js';
import SeatingArrangement from './algorithm.js';
import generateSeatingMatrixPDF from './pdf.js';
import optimizer from './optimizer.js';
import generateSeatingPDF from './html2.js';
import generateSeatingMatrixPDFWithCourse from './seatingMatrixPdfGeneratorWithCourse.js';
import answerBookReport from './answerBookReport.js';

/**
 * Assign seats to students for a given date.
 *
 * @param {Date} [date=new Date()] - The date for which seats are assigned.
 * @param {string} [orderBy='rollNumber'] - The sorting order for assignment.
 *   Should be either 'rollNumber' or 'id' (register_number).
 * @returns {Promise} A promise that resolves when seats are successfully assigned.
 */
async function assignSeats({
    date = new Date(),
    timeCode = 'AN',
    orderBy = 'rollNumber',
    fileName = 'unnamed',
    optimize = true,
    examType = 'internal',
}) {
    /** @type {[NestedStudentArray, number]} */
    let [students, totalStudents] = await getData({ date, orderBy, timeCode });

    console.log(`total subjects : ${students.length}`);
    console.log(`Generated ${totalStudents} students`);

    let { rooms, totalSeats } = await generateSeatingMatrix(examType);

    console.log(
        `Generated ${rooms.length} classes with a total of ${totalSeats} seats.`,
    );

    let roomIndex = 0;
    while (students.length > 0 && roomIndex < rooms.length) {
        const seatingArrangement = new SeatingArrangement({
            students,
            room: rooms[roomIndex],
        });

        try {
            seatingArrangement.assignSeats();
        } catch (error) {
            console.error(error.message);
        }
        const unassignedStudents = seatingArrangement.getUnsignedStudents();
        students = unassignedStudents.filter(
            (classStudents) => classStudents.length > 0,
        );

        roomIndex += 1;
    }

    let { totalEmptySeats, totalAssignedSeats } = seatCount(rooms);
    let totalUnassignedStudents = totalStudents - totalAssignedSeats;

    if (totalAssignedSeats === totalStudents) {
        console.log(
            `All students have been assigned ( ${totalAssignedSeats}  )`,
        );
    } else
        console.warn(
            `${totalUnassignedStudents} students are not been assigned`,
        );

    // optimizing
    if (optimize && totalUnassignedStudents > 0) {
        const optimizedRooms = await optimizer(
            _.cloneDeep(rooms),
            totalUnassignedStudents,
            students,
        );

        rooms = optimizedRooms;

        const { totalEmptySeats: h1, totalAssignedSeats: h2 } =
            seatCount(rooms);

        totalEmptySeats = h1;
        totalAssignedSeats = h2;

        totalUnassignedStudents = totalStudents - totalAssignedSeats;

        if (totalAssignedSeats === totalStudents) {
            console.log(
                `All students have been assigned ( ${totalAssignedSeats}  )`,
            );
        } else
            console.warn(
                `${totalUnassignedStudents} students are not been assigned`,
            );

        const repeatingRegNos = findRepeatingRegNos(rooms);

        if (repeatingRegNos.length > 0) {
            console.log('Repeating registration numbers found:');
            console.log(repeatingRegNos);
        } else {
            console.log('No repeating registration numbers found.');
        }
    }
    generateSeatingMatrixPDF(
        rooms,
        date,
        totalStudents,
        totalAssignedSeats,
        totalEmptySeats,
        totalUnassignedStudents,
        fileName,
    );
    generateSeatingMatrixPDFWithCourse(
        rooms,
        date,
        totalStudents,
        totalAssignedSeats,
        totalEmptySeats,
        totalUnassignedStudents,
        fileName,
    );

    generateSeatingPDF(rooms, date, fileName);

    answerBookReport(rooms, date, fileName);

    return [rooms, totalUnassignedStudents];
}

export { assignSeats };
