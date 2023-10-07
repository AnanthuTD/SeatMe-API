import fs from 'fs';
import getRootDir from '../../../getRootDir.js';

/**
 * Generate an HTML file containing seating matrices for all classes.
 * @param {Array} classes - An array of seating matrices for all classes.
 */
export default function generateSeatingMatrixHTML(
    classes,
    totalExaminees = 'not provided',
    totalAssignedSeats = 'not provided',
    totalEmptySeats = 'not provided',
    totalNotAssignedStudents = 'not provided',
) {
    const fileName = 'seating_matrices.html';

    // Create an HTML string
    let htmlContent = `<html><head><title>Seating Matrices</title></head><body><h1>Total Examinees: ${totalExaminees}</h1>`;
    htmlContent = `<h1>Total available seats: ${
        totalAssignedSeats + totalEmptySeats
    }<br>Total Assigned Seats: ${totalAssignedSeats}<br>Total Unassigned Seats: ${totalEmptySeats}<br>Total Unassigned Examinees: ${totalNotAssignedStudents}</h1>`;

    for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
        const { seatingMatrix, exams } = classes[classIndex];

        // Create an HTML table for the current class
        htmlContent += `<h2>Seating Matrix for Class ${classIndex + 1}</h2>`;

        htmlContent += '<table cellpadding="5">';
        htmlContent += '<tr><th colspan=2>courses</th></tr>';
        htmlContent += '<tr><th>id</th><th>name</th></tr>';
        // eslint-disable-next-line no-loop-func
        exams.forEach((exam) => {
            htmlContent += `<tr><td>${exam.id}</td><td>${exam.name}</td></tr>`;

            exam.examines.forEach((regno) => {
                if (regno !== undefined) {
                    htmlContent += `<tr><td colspan="2">${regno.toString()}</td></tr>`;
                }
            });
        });

        htmlContent += '</table>';

        htmlContent += "<table border='1'>";

        // Create the table header row
        htmlContent += '<tr><th>Row/Col</th>';
        for (let col = 1; col <= seatingMatrix[0].length; col += 1) {
            htmlContent += `<th>Col ${col}</th>`;
        }
        htmlContent += '</tr>';

        // Create the table rows for the seating matrix
        for (let row = 0; row < seatingMatrix.length; row += 1) {
            htmlContent += `<tr><td>${row + 1}</td>`; // Row number
            for (let col = 0; col < seatingMatrix[row].length; col += 1) {
                const seat = seatingMatrix[row][col];
                if (seat.occupied) {
                    htmlContent += `<td>Seat ${seat.id}<br>Regno: ${seat.regno}<br>(Exam: ${seat.exam})</td>`;
                } else {
                    htmlContent += '<td>Empty</td>';
                }
            }
            htmlContent += '</tr>';
        }

        // Close the table for the current class
        htmlContent += '</table>';
    }

    // Close the HTML body and document
    htmlContent += '</body></html>';

    // Write the HTML content to a file
    fs.writeFileSync(`${getRootDir()}/public/${fileName}`, htmlContent);

    console.log(
        `Seating matrices for all classes have been saved to ${fileName}`,
    );
}

// Example usage:
// Pass an array containing seating matrices for all classes to generateSeatingMatrixHTML
// generateSeatingMatrixHTML(yourClassesArray);
