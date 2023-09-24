import { models } from '../../sequelize/models.js';

const createRecord = async (seating) => {
    const records = [];
    await seating.forEach((room) => {
        const { id, seatingMatrix } = room;
        const numRows = seatingMatrix.length;
        const numCols = seatingMatrix[0].length;

        for (let row = 0; row < numRows; row += 1) {
            for (let col = 0; col < numCols; col += 1) {
                if (!seatingMatrix[row][col].occupied) continue;
                const serialNumber = row * numCols + col + 1;
                const { id: CourseId } = seatingMatrix[row][col];
                const StudentId = seatingMatrix[row][col].regno;

                // console.log(seatingMatrix[row][col]);

                const record = {
                    seat_number: serialNumber,
                    RoomId: id,
                    StudentId,
                    CourseId,
                };

                records.push(record); // Push the record object into the array
            }
        }
    });

    // console.log(JSON.stringify(records, null, 2));

    await models.StudentSeat.bulkCreate(records);
};

export { createRecord };
