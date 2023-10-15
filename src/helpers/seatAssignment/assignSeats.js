import findRepeatingRegNos from './findRepeatingStudents.js';
import getData from './getData.js';
import generateSeatingMatrixHTML from './htmlSeatingMatrix.js';
import seatCount from './seatCount.js';
import generateSeatingMatrix from './seatingMatrix.js';
import SeatingArrangement from './algorithm.js';

/**
 * Assign seats to students for a given date.
 *
 * @param {Date} [date=new Date()] - The date for which seats are assigned.
 * @param {string} [orderBy='rollNumber'] - The sorting order for assignment.
 *   Should be either 'rollNumber' or 'id' (register_number).
 * @returns {Promise} A promise that resolves when seats are successfully assigned.
 */
async function assignSeats({ date = new Date(), orderBy = 'rollNumber' }) {
    /** @type {[NestedStudentArray, number]} */
    let [students, totalStudents] = await getData(date, orderBy);

    console.log(`total subjects : ${students.length}`);
    console.log(`Generated ${totalStudents} students`);

    const { classes, totalSeats } = await generateSeatingMatrix();

    console.log(
        `Generated ${classes.length} classes with a total of ${totalSeats} seats.`,
    );

    let classesIndex = 0;
    while (students.length > 0 && classesIndex < classes.length) {
        const seatingArrangement = new SeatingArrangement({
            students,
            room: classes[classesIndex],
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

        classesIndex += 1;
    }

    const repeatingRegNos = findRepeatingRegNos(classes);

    if (repeatingRegNos.length > 0) {
        console.log('Repeating registration numbers found:');
        console.log(repeatingRegNos);
    } else {
        console.log('No repeating registration numbers found.');
    }

    const { totalEmptySeats, totalAssignedSeats } = seatCount(classes);
    const totalNotAssignedStudents = totalStudents - totalAssignedSeats;
    if (totalAssignedSeats === totalStudents) {
        console.log(
            `All students have been assigned ( ${totalAssignedSeats}  )`,
        );
    } else
        console.warn(
            `${totalNotAssignedStudents} students are not been assigned`,
        );

    generateSeatingMatrixHTML(
        classes,
        date,
        totalStudents,
        totalAssignedSeats,
        totalEmptySeats,
        totalNotAssignedStudents,
    );

    console.log(JSON.stringify(students, null, 4));

    return classes;
}

export { assignSeats };

assignSeats({ date: new Date('2023-10-11') });
