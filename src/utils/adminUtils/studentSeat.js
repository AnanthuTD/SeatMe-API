import { models } from '../../sequelize/models.js';

const createRecord = async (seating) => {
    const records = [];
    await seating.forEach((room) => {
        const { id, seatingMatrix } = room;
        const numRows = seatingMatrix.length;
        const numCols = seatingMatrix[0].length;

        for (let row = 0; row < numRows; row += 1) {
            for (let col = 0; col < numCols; col += 1) {
                // eslint-disable-next-line no-continue
                if (!seatingMatrix[row][col].occupied) continue;
                const serialNumber = row * numCols + col + 1;
                const { id: courseId } = seatingMatrix[row][col];
                const studentId = seatingMatrix[row][col].regno;

                // console.log(seatingMatrix[row][col]);

                const record = {
                    seatNumber: serialNumber,
                    roomId: id,
                    studentId,
                    courseId,
                };

                records.push(record); // Push the record object into the array
            }
        }
    });

    // console.log(JSON.stringify(records, null, 2));

    await models.studentSeat.bulkCreate(records);
};

export { createRecord };
