import puppeteer from 'puppeteer';
// import fs from 'fs';
import logger from '../logger.js';
import getRootDir from '../../../getRootDir.js';

export default async function generateSeatingArrangementPDF(
    rooms,
    date,
    fileName = 'seatingArrangement',
) {
    date = new Date(date);
    let fullHtml = '';

    function arabicToRoman(num) {
        const romanNumerals = [
            'I',
            'II',
            'III',
            'IV',
            'V',
            'VI',
            'VII',
            'VIII',
            'IX',
            'X',
        ];

        return romanNumerals[num - 1];
    }

    for (let classIndex = 0; classIndex < rooms.length; classIndex += 1) {
        const { exams, id, description } = rooms[classIndex];

        const allDistinctSemesters = [
            ...new Set(exams.map((program) => program.semester)),
        ];

        const romanSemesters = allDistinctSemesters.map((semester) =>
            arabicToRoman(semester),
        );

        const maxExaminees = Math.max(
            ...exams.map((program) => program.examines.length),
        );

        const monthAbbreviation = date.toLocaleString('default', {
            month: 'short',
        });

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const formattedDate = `${day}.${month}.${year}`;

        let html = `
        <style>
            @page {
                size: A4;
                margin: 0;
            }
        </style>
        <h3>M.E.S COLLEGE MARAMPALLY ${classIndex + 1}</h3>
        <p>Seating Arrangements for ${romanSemesters.join(
            ', ',
        )} Semester CBCS Regular & Supple, ${romanSemesters.join(
            ', ',
        )} PVT CBCS Exam ${monthAbbreviation} ${date.getFullYear()}</p>
        <div style="display: flex; justify-content: space-between;">
            <h3>Hall No: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${id} ${
            description ? '(' + description + ')' : ''
        }</h3>
            <h3>${formattedDate}</h3>
        </div>
        <table border="1">
            <thead>`;

        exams.forEach((program) => {
            html += `<th>${program.name}</th>`;
        });

        html += ` </thead>
        <tbody>`;

        for (let row = 0; row < maxExaminees; row += 1) {
            html += `<tr>`;
            exams.forEach((program) => {
                const examinee = program.examines[row];
                html += `<td>${examinee !== undefined ? examinee.toString() : ''}</td>`;
            });
            html += `</tr>`;
        }

        html += `
            </tbody>
        </table>`;

        const programExamineeCounts = exams.map((program) => ({
            name: program.name,
            count: program.examines.length,
        }));

        // Calculate the total count using reduce
        const totalCount = programExamineeCounts.reduce(
            (sum, program) => sum + program.count,
            0,
        );

        // Add the total count as the last object
        programExamineeCounts.push({
            name: 'TOTAL',
            count: totalCount,
        });

        // Create a table for program examinee counts
        html += `
            <table border="1">
                <thead>
                    <th>Program</th>
                    <th>Total Examinees</th>
                </thead>
                <tbody>`;

        programExamineeCounts.forEach((program) => {
            html += `
                    <tr>
                        <td>${program.name}</td>
                        <td>${program.count}</td>
                    </tr>`;
        });

        html += `
                </tbody>
            </table>`;

        fullHtml += html;
    }

    /* const htmlFilePath = `${getRootDir()}/pdf/${fileName}.html`;
    fs.writeFileSync(htmlFilePath, fullHtml, 'utf-8');
    logger(`HTML file saved: ${htmlFilePath}`); */

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(fullHtml);

    // Set the path to save the PDF file
    const pdfPath = `${getRootDir()}/pdf/${fileName}.pdf`;

    // Generate PDF
    await page.pdf({
        path: pdfPath,
        format: 'A4',
    });

    await browser.close();

    // Log success
    logger(`PDF generated successfully: ${pdfPath}`);
}
