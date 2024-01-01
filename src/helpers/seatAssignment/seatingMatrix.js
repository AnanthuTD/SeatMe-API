import { models, sequelize } from '../../sequelize/models.js';

/**
 * Generates a seating matrix for classes based on available rooms.
 * @returns {Object} An object containing the following properties:
 * - `classes` (Array<Class>): An array of classes, each with a seating matrix.
 * - `totalSeats` (number): The total number of seats across all classes.
 */
async function generateSeatingMatrix(examType) {
    /**
     * Represents a class with a seating matrix.
     * @typedef {Object} Class
     * @property {Array<Array<{ occupied: boolean, exam: string }>>} seatingMatrix - The seating matrix for the class.
     * @property {number} id - The ID of the class.
     * @property {number} floor - The floor where the class is located.
     * @property {number} blockId - The ID of the block where the class is located.
     * @property {string} blockName - The name of the block where the class is located.
     * @property {number} seats - The total number of seats in the class.
     */

    /**
     * Represents a block with a name.
     * @typedef {Object} block
     * @property {string} name - The name of the block.
     */

    let rowsAndCols = [];
    if (examType === 'final')
        rowsAndCols = [
            ['final_rows', 'rows'],
            ['final_cols', 'cols'],
        ];
    else
        rowsAndCols = [
            ['internal_rows', 'rows'],
            ['internal_cols', 'cols'],
        ];

    try {
        const rooms = await models.room.findAll({
            where: { isAvailable: true },
            include: { model: models.block, attributes: { include: ['name'] } },
            raw: true,
            attributes: [
                'id',
                ...rowsAndCols,
                'floor',
                [
                    sequelize.literal(
                        `${rowsAndCols[0][0]}*${rowsAndCols[1][0]}`,
                    ),
                    'seats',
                ],
                'description',
                'priority',
            ],
            order: [['priority', 'ASC']],
        });

        /**
         * Represents an array of classes with seating matrices.
         * @type {Array<Class>}
         */
        const defineRooms = [];

        let totalSeats = 0;

        rooms.forEach((room) => {
            totalSeats += room.seats;
            const currentClass = {
                seatingMatrix: Array.from({ length: room.rows }, () =>
                    Array.from({ length: room.cols }, () => ({
                        occupied: false,
                        courseName: null,
                        courseId: null,
                        id: null,
                        name: null,
                        examId: null,
                    })),
                ),
                exams: [],
                id: room.id,
                description: room.description,
                floor: room.floor,
                blockId: room['block.id'],
                blockName: room['block.name'],
                seats: room.seats,
            };

            defineRooms.push(currentClass);
        });

        return { rooms: defineRooms, totalSeats };
    } catch (error) {
        console.error('Error generating seating matrix:', error);
        throw error;
    }
}

// Export the function
export default generateSeatingMatrix;
