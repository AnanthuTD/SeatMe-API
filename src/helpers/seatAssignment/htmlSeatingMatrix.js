import fs from 'fs';
import getRootDir from '../../../getRootDir.js';

/**
 * Generate an HTML file containing seating matrices for all classes.
 * @param {Array} classes - An array of seating matrices for all classes.
 * @param {string} date - The date to include in the filename.
 * @param {string} totalExaminees - Total examinees information.
 * @param {string} totalAssignedSeats - Total assigned seats information.
 * @param {string} totalEmptySeats - Total empty seats information.
 * @param {string} totalNotAssignedStudents - Total unassigned students information.
 */
export default function generateSeatingMatrixHTML(
    classes,
    date,
    totalExaminees = 'not provided',
    totalAssignedSeats = 'not provided',
    totalEmptySeats = 'not provided',
    totalNotAssignedStudents = 'not provided',
) {
    date = new Date(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const fileName = `${year}-${month}-${day}.html`;

    // Create an HTML string
    let htmlContent = `
    <html>
    <head>
      <title>Seating Matrices</title>
    </head>
    <body>
      <h1>Total Examinees: ${totalExaminees}</h1>
      <h1>
        Total available seats: ${totalAssignedSeats + totalEmptySeats}<br>
        Total Assigned Seats: ${totalAssignedSeats}<br>
        Total Unassigned Seats: ${totalEmptySeats}<br>
        Total Unassigned Examinees: ${totalNotAssignedStudents}
      </h1>
  `;

    for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
        const { seatingMatrix, exams } = classes[classIndex];

        // Create an HTML table for the current class
        htmlContent += `<h2>Seating Matrix for Class ${classIndex + 1}</h2>`;

        htmlContent += `
        <table cellpadding="5" border='1'>
          <tr>
            <th>Seat</th>
        `;

        // Create column headers for each program
        exams.forEach((program) => {
            htmlContent += `<th>${program.name}-sem_${program.semester}</th>`;
        });

        htmlContent += `
          </tr>
        `;

        // Create rows for examinees
        const maxExaminees = Math.max(
            ...exams.map((program) => program.examines.length),
        );

        for (let row = 0; row < maxExaminees; row++) {
            htmlContent += '<tr>';
            htmlContent += `<td>${row + 1}</td>`; // Seat number

            exams.forEach((program) => {
                const examinee = program.examines[row];
                htmlContent += `<td>${
                    examinee !== undefined ? examinee.toString() : ''
                }</td>`;
            });

            htmlContent += '</tr>';
        }

        htmlContent += '</table>';

        htmlContent += "<table cellpadding='5' border='1'>";
        htmlContent += '<tr><th>Seat</th>';

        for (let col = 1; col <= seatingMatrix[0].length; col += 1) {
            htmlContent += `<th>Col ${col}</th>`;
        }

        htmlContent += '</tr>';

        const numRows = seatingMatrix.length;
        for (let row = 0; row < numRows; row += 1) {
            const numCols = seatingMatrix[row].length;
            htmlContent += `<tr><td>${row + 1}</td>`; // Seat number
            for (let col = 0; col < numCols; col += 1) {
                const seat = seatingMatrix[row][col];
                if (seat.occupied) {
                    htmlContent += `
            <td>
              Seat: ${row * numCols + col + 1};<br>
              Regno: ${seat.id}<br>
              (Exam: ${seat.courseName})
            </td>
          `;
                } else {
                    htmlContent += '<td>Empty</td>';
                }
            }
            htmlContent += '</tr>';
        }

        htmlContent += '</table>';
    }

    htmlContent += '</body></html>';

    // Write the HTML content to a file
    fs.writeFileSync(`${getRootDir()}/public/${fileName}`, htmlContent);

    console.log(
        `Seating matrices for all classes have been saved to ${fileName}`,
    );
}
