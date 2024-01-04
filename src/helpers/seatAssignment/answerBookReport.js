import puppeteer from 'puppeteer';
import fs from 'fs';
import logger from '../logger.js';
import getRootDir from '../../../getRootDir.js';

export default async function answerBookReport(
    rooms,
    date,
    fileName = 'seatingArrangement',
) {
    date = new Date(date);
    let fullHtml = ''; // Accumulate HTML for all classes

    function arabicToWord(num) {
        const romanNumerals = [
            'First',
            'Second',
            'Third',
            'Fourth',
            'Fifth',
            'Sixth',
            'Seventh',
            'Eighth',
            'Ninth',
            'Tenth',
        ];

        return romanNumerals[num - 1];
    }

    for (let classIndex = 0; classIndex < rooms.length; classIndex += 1) {
        const { exams, id, description } = rooms[classIndex];

        const allDistinctSemesters = [
            ...new Set(exams.map((program) => program.semester)),
        ];

        const semesterWord = allDistinctSemesters.map((semester) =>
            arabicToWord(semester),
        );

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const formattedDate = `${day}/${month}/${year}`;

        let html = `
                    <style>
                        body{
                            margin:5%;
                        }
                        table, th, td {
                            border: 1px solid black;
                            border-collapse: collapse;
                        }
                        .align-right {
                            text-align: right;
                        } 
                        @media print {
                            .page-break {
                              page-break-before: always;
                            }
                        }                       
                    </style>
                    <body>
                    <h2 align="center">MAHATMA GANDHI UNIVERSITY</h2>
                    <h2 align="center">(To be Prepared in duplicate)</h2>
                    <h3 align="center">(Account of Main And Additional Answer Books issued to Candidates)</h3>
                    <h4>Name of Exam: ${semesterWord} SEM UG Regular & Supple Exam December 2023</h4>
                    <h2>Date of Examination . ${formattedDate}</h2>
                    <h2>Centre of Examination . MES COLLEGE MARAMPALLY</h2>
                    <h2>HALL No: ${id}</h2>
                    <table border="1" style="width: 100%;">
                        <thead>
                            <tr>
                                <th rowspan="2" align="center">Reg.No</th>
                                <th colspan="3" align="center">No of Answer books issued with series</th>
                            </tr>
                            <tr>
                                <th align="center">Main Answer books</th>
                                <th align="center">Addl.Answer books</th>
                                <th align="center">Signature of thc Candidates</th>
                            </tr>
                        </thead>
                        <tbody>`;

        let alignRight = false; // Initialize the alignment flag

        exams.forEach((program) => {
            const examinees = program.examines;
            const programName = program.name;
            alignRight = !alignRight;
            const alignmentClass = alignRight ? 'align-right' : ''; // Add a class based on the flag
            html += `
                                <tr>
                                    <td class="${alignmentClass}">
                                        <strong>${programName}</strong>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>`;
            examinees.forEach((examinee) => {
                html += `
                                    <tr>
                                        <td class="${alignmentClass}">
                                            ${
                                                examinee !== undefined
                                                    ? examinee.toString()
                                                    : ''
                                            }
                                        </td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </tr>`;
            });
        });

        for (let index = 0; index < 10; index += 1) {
            html += `
                    <tr>
                        <td>&nbsp;</td>
                        <td> </td>
                        <td> </td>
                        <td> </td>
                    </tr>`;
        }

        html += `
                <tr>
                    <td colspan="2">Total No.of Answer Books Received</td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="2">Total No.of Answer Books issued</td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="2">Balance returned to chief Superintendent</td>
                    <td></td>
                    <td></td>
                </tr>
            </tbody>
        </table>`;

        // Create a table for program examinee counts
        html += `
                <div style="display: flex; width: 100%;">
                    <p>Place: Marampally</p>
                    <div style="margin-left: 30%;">
                        <p>Signature of Invigilator</p>
                        <p>Name of Invigilator</p>
                    </div>
                </div>
                <p><strong>N.B:</strong></p>
                <ul>
                    <li>
                        <p>One copy to be retained in the office</p>
                    </li>
                    <li>
                        <p>One copy to be arranged otherwise send to the university along with the statement</p>
                    </li>
                    <li>
                        <p>Accounts of answer books after the close of the examination</p>
                    </li>
                </ul>`;
        html += `</body>`;

        html += `<div class="page-break"></div>`;

        fullHtml += html;
    }

    const htmlFilePath = `${getRootDir()}/pdf/answer-book-report${fileName}.html`;
    fs.writeFileSync(htmlFilePath, fullHtml, 'utf-8');
    logger(`HTML file saved: ${htmlFilePath}`);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(fullHtml);

    // Set the path to save the PDF file
    const pdfPath = `${getRootDir()}/pdf/answer-book-report${fileName}.pdf`;

    // Generate PDF
    await page.pdf({
        path: pdfPath,
        format: 'A4',
    });

    await browser.close();

    // Log success
    logger(`PDF generated successfully: ${pdfPath}`);
}
