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
        { title: 'Teacher ID', dataKey: 'authUser.id' },
        { title: 'Name', dataKey: 'authUser.name' },
        { title: 'Email', dataKey: 'authUser.email' },
        { title: 'Designation', dataKey: 'authUser.designation' },
        { title: 'Room ID', dataKey: 'room.id' },
        { title: 'Block', dataKey: 'room.block.name' },
    ];

    const rows = teacherDetails.map((teacher) => ({
        'authUser.id': teacher.authUser.id,
        'authUser.name': teacher.authUser.name,
        'authUser.email': teacher.authUser.email,
        'authUser.designation': teacher.authUser.designation,
        'room.id': teacher.room.id,
        'room.block.name': teacher.room.block.name,
    }));

    // Set table options
    const tableOptions = {
        headStyles: { fillColor: [100, 100, 100] },
    };

    // Add the table to the PDF
    doc.autoTable(columns, rows, tableOptions);

    // Save or display the PDF
    doc.save(
        `${getRootDir()}/pdf/${teacherDetails[0].dateTime.date}-${
            teacherDetails[0].dateTime.timeCode
        }.pdf`,
    );
};

export default generateTeacherDetailsPDF;
