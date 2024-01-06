import _ from 'lodash';
import findRepeatingRegNos from './findRepeatingStudents.js';
import getData from './getData.js';
import seatCount from './seatCount.js';
import generateSeatingMatrix from './seatingMatrix.js';
import SeatingArrangement from './algorithm.js';
import generateSeatingMatrixPDF from './seatingMatrixPdfGenerator.js';
import optimizer from './optimizer.js';
import generateSeatingArrangementPDF from './seatingArrangementMainReport.js';
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
    examName,
    timeCode = 'AN',
    orderBy = 'rollNumber',
    fileName = 'unnamed',
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
    console.log(examType);
    while (students.length > 0 && roomIndex < rooms.length) {
        const seatingArrangement = new SeatingArrangement({
            students,
            room: rooms[roomIndex],
            examType,
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
    if (totalUnassignedStudents > 0) {
        const optimizedRooms = await optimizer(
            _.cloneDeep(rooms),
            totalUnassignedStudents,
            students,
            examType,
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
    try {
        await Promise.all([
            generateSeatingMatrixPDF(
                rooms,
                date,
                totalStudents,
                totalAssignedSeats,
                totalEmptySeats,
                totalUnassignedStudents,
                fileName,
            ),
            generateSeatingMatrixPDFWithCourse(
                rooms,
                date,
                totalStudents,
                totalAssignedSeats,
                totalEmptySeats,
                totalUnassignedStudents,
                fileName,
            ),
            generateSeatingArrangementPDF({ rooms, date, fileName, examName }),
            answerBookReport({ rooms, date, fileName, examName }),
        ]);

        return [rooms, totalUnassignedStudents];
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}

export { assignSeats };
