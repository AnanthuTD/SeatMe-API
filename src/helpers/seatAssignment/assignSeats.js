import findRepeatingRegNos from './findRepeatingStudents.js';
import getData from './getData.js';
// import generateSeatingMatrixHTML from './htmlSeatingMatrix.js';
import seatCount from './seatCount.js';
import generateSeatingMatrix from './seatingMatrix.js';
import SeatingArrangement from './algorithm.js';
import generateSeatingMatrixPDF from './pdf.js';
import optimizer from './optimizer.js';

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
    orderBy = 'rollNumber',
    fileName = 'unnamed',
    optimize = true,
}) {
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

    let { totalEmptySeats, totalAssignedSeats } = seatCount(classes);
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
        console.log(optimize);
        totalUnassignedStudents = await optimizer(
            classes,
            totalUnassignedStudents,
            students,
        );

        // console.log(JSON.stringify(classes, null, 2));
        const { totalEmptySeats: h1, totalAssignedSeats: h2 } =
            seatCount(classes);
        console.log(h1, h2);

        totalEmptySeats = h1;
        totalAssignedSeats = h2;

        totalUnassignedStudents = totalStudents - h2;
        if (h2 === totalStudents) {
            console.log(`All students have been assigned ( ${h2}  )`);
        } else
            console.warn(
                `${totalUnassignedStudents} students are not been assigned`,
            );

        const repeatingRegNos = findRepeatingRegNos(classes);

        if (repeatingRegNos.length > 0) {
            console.log('Repeating registration numbers found:');
            console.log(repeatingRegNos);
        } else {
            console.log('No repeating registration numbers found.');
        }
    }
    generateSeatingMatrixPDF(
        classes,
        date,
        totalStudents,
        totalAssignedSeats,
        totalEmptySeats,
        totalUnassignedStudents,
        fileName,
    );

    return [classes, totalUnassignedStudents, students];
}

export { assignSeats };

// assignSeats({ date: new Date('2023-10-11') });
