import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import getRootDir from '../../../getRootDir.js';
import { models } from '../../sequelize/models.js';

const generateTeacherDetailsPDF = async (dateTimeId) => {
    const teacherDetails = await models.teacherSeat.findAll({
        where: { dateTimeId },
        include: [
            { model: models.room, include: [{ model: models.block }] },
            { model: models.authUser },
            { model: models.dateTime },
        ],
    });
    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Define the table columns and rows
    const columns = [
        { header: 'Teacher ID', dataKey: 'authUser.id' },
        { header: 'Name', dataKey: 'authUser.name' },
        { header: 'Email', dataKey: 'authUser.email' },
        { header: 'Designation', dataKey: 'authUser.designation' },
        { header: 'Room ID', dataKey: 'room.id' },
        { header: 'Block', dataKey: 'room.block.name' },
    ];

    const rows = teacherDetails.map((teacher) => ({
        'authUser.id': teacher.authUser.id,
        'authUser.name': teacher.authUser.name,
        'authUser.email': teacher.authUser.email,
        'authUser.designation': teacher.authUser.designation,
        'room.id': teacher.room.id,
        'room.block.name': teacher.room.block.name,
    }));

    // Add the table to the PDF
    doc.autoTable({ columns, body: rows });

    // Save or display the PDF
    doc.save(
        `${getRootDir()}/reports/${teacherDetails[0].dateTime.date}-${
            teacherDetails[0].dateTime.timeCode
        }.pdf`,
    );
};

export default generateTeacherDetailsPDF;
