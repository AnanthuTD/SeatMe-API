import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import getRootDir from '../../../getRootDir.js';

export default async function generateSeatingMatrixPDF(
    classes,
    date,
    totalExaminees = 'not provided',
    totalAssignedSeats = 'not provided',
    totalEmptySeats = 'not provided',
    unassignedExaminees = 'not provided',
    fileName = 'seatingArrangement.pdf',
) {
    // eslint-disable-next-line new-cap
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    doc.setFontSize(16);
    doc.text('Seating Matrices', 10, 10);

    doc.setFontSize(12);
    doc.text(`Total Examinees: ${totalExaminees}`, 10, 20);
    doc.text(`Total Unassigned Examinees: ${unassignedExaminees}`, 10, 30);
    doc.text(`Total Assigned Seats: ${totalAssignedSeats}`, 10, 40);
    doc.text(`Total Unassigned Seats: ${totalEmptySeats}`, 10, 50);

    let yOffset = 60;

    for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
        const { seatingMatrix, /* exams, */ id, floor, description, blockId } =
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
        tableData2.push([...tableHeaders2]); // Create a copy of tableHeaders2

        // Add rows for seating matrix
        doc.setFontSize(14);
        const numRows = seatingMatrix.length;
        for (let row = 0; row < numRows; row += 1) {
            const numCols = seatingMatrix[row].length;
            const rowData = [
                /* row + 1 */
            ]; // Seat number
            for (let col = 0; col < numCols; col += 1) {
                const seat = seatingMatrix[row][col];
                if (seat.occupied) {
                    rowData.push(
                        seat.id,
                        /* \nExam: ${seat.courseName} */
                        /* Seat: ${row * numCols + col + 1}\n */
                    );
                } else {
                    rowData.push('--');
                }
            }
            tableData2.push(rowData);
        }

        const styles = {
            fontSize: 12,
            margin: '0px',
        };

        // Use jsPDF-AutoTable for the second table
        doc.autoTable({
            startY: yOffset + 10,
            head: [tableHeaders2],
            body: tableData2.slice(1), // Exclude the header from the body
            styles,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        yOffset = 20;
    }

    // Save the PDF
    doc.save(`${getRootDir()}/pdf/matrix-${fileName}.pdf`);
}
