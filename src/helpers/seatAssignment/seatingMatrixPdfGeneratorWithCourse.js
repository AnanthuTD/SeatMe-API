import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import getRootDir from '../../../getRootDir.js';
import logger from '../logger.js';

export default async function generateSeatingMatrixPDFWithCourse(
    classes,
    date,
    totalExaminees = 'not provided',
    totalAssignedSeats = 'not provided',
    totalEmptySeats = 'not provided',
    unassignedExaminees = 'not provided',
    fileName = 'seatingArrangement.pdf',
) {
    // eslint-disable-next-line new-cap
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Seating Matrices', 10, 10);

    doc.setFontSize(12);
    doc.text(`Total Examinees: ${totalExaminees}`, 10, 20);
    doc.text(`Total Unassigned Examinees: ${unassignedExaminees}`, 10, 30);
    doc.text(`Total Assigned Seats: ${totalAssignedSeats}`, 10, 40);
    doc.text(`Total Unassigned Seats: ${totalEmptySeats}`, 10, 50);

    let yOffset = 60;

    for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
        const { seatingMatrix, /* exams, */ id, floor, blockId, description } =
            classes[classIndex];

        if (classIndex > 0) {
            doc.addPage();
        }

        doc.setFontSize(14);
        doc.text(
            `Seating Matrix for Room ${id} ${
                description ? `(${description})` : ''
            }`,
            10,
            yOffset,
        );
        yOffset += 10;

        doc.setFontSize(12);
        if (floor) {
            doc.text(`Floor: ${floor}`, 10, yOffset);
            yOffset += 10;
        }
        /* if (description) {
            doc.text(`Description: ${description}`, 10, yOffset);
            yOffset += 10;
        } */

        doc.text(`Block: ${blockId}`, 10, yOffset);

        // Add a table for seating matrix
        /* const tableData = [];
        const tableHeaders = [''];

        exams.forEach((program) => {
            tableHeaders.push(`${program.name}-sem_${program.semester}`);
        });

        // Add column headers
        tableData.push([...tableHeaders]); // Create a copy of tableHeaders

        // Add rows for examinees
        const maxExaminees = Math.max(
            ...exams.map((program) => program.examines.length),
        );

        for (let row = 0; row < maxExaminees; row += 1) {
            const rowData = [row + 1]; // Seat number

            exams.forEach((program) => {
                const examinee = program.examines[row];
                rowData.push(examinee !== undefined ? examinee.toString() : '');
            });

            tableData.push(rowData);
        }

        // Use jsPDF-AutoTable for the table
        doc.autoTable({
            startY: yOffset + 10,
            head: [tableHeaders],
            body: tableData.slice(1), // Exclude the header from the body
        });

        // Add a table for seating matrix
        yOffset += doc.autoTable.previous.finalY + 20; */

        const tableHeaders2 = [];
        const tableData2 = [];

        for (let col = 1; col <= seatingMatrix[0].length; col += 1) {
            tableHeaders2.push(`Col ${col}`);
        }

        // Add column headers
        // tableData2.push([...tableHeaders2]);

        // Add rows for seating matrix
        const numRows = seatingMatrix.length;
        for (let row = 0; row < numRows; row += 1) {
            const numCols = seatingMatrix[row].length;
            const rowData = [
                /* row + 1 */
            ]; // Seat number
            for (let col = 0; col < numCols; col += 1) {
                const seat = seatingMatrix[row][col];
                if (seat.occupied) {
                    /* rowData.push(
                        `Seat: ${row * numCols + col + 1}\nRegno: ${
                            seat.id
                        }\nExam: ${seat.courseName}`,
                    ); */
                    rowData.push(
                        `program: ${seat.programName}\nExam: ${seat.courseName}`,
                    );
                } else {
                    rowData.push('--');
                }
            }
            tableData2.push(rowData);
        }

        const numCols = seatingMatrix[0].length;
        const equalColumnWidth = doc.internal.pageSize.width / numCols;

        const columnStyles = {};
        for (let i = 1; i < numCols; i += 1) {
            columnStyles[i] = { cellWidth: equalColumnWidth - 5 };
        }

        doc.autoTable({
            startY: yOffset + 10,
            head: [tableHeaders2],
            body: tableData2,
            columnStyles,
        });

        yOffset = 20;
    }

    // Save the PDF
    doc.save(`${getRootDir()}/pdf/matrix-${fileName}-with-course.pdf`);
}
