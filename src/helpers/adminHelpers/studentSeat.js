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
                const { examId } = seatingMatrix[row][col];
                const studentId = seatingMatrix[row][col].id;

                // console.log(seatingMatrix[row][col]);

                const record = {
                    seatNumber: serialNumber,
                    roomId: id,
                    studentId,
                    examId,
                };

                records.push(record); // Push the record object into the array
            }
        }
    });

    // console.log(JSON.stringify(records, null, 2));
    try {
        await models.studentSeat.bulkCreate(records);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Handle unique constraint violation
            console.error('Unique constraint violation occurred.');

            // Create an array of promises to update the violating records
            const updatePromises = records.map((record) => {
                return models.studentSeat.update(record, {
                    where: {
                        studentId: record.studentId,
                        examId: record.examId,
                    },
                });
            });

            // Execute all update promises concurrently
            try {
                await Promise.all(updatePromises);
                console.log('All records updated successfully');
            } catch (updateError) {
                console.error('Error updating records:', updateError);
            }
        } else {
            // Handle other errors
            console.error('Error during bulk insert of studentSeat:', error);
        }
    }
};

export { createRecord };
