import logger from '../logger.js';

/**
 * @typedef {Object} SeatCounts
 * @property {number} totalEmptySeats - The total number of empty seats.
 * @property {number} totalAssignedSeats - The total number of assigned seats.
 */

/**
 * Calculate the seat counts for a list of classes.
 * @param {Array} classes - An array of class objects.
 * @returns {SeatCounts} - An object containing seat count information.
 */
export default function seatCount(classes) {
    const seatData = classes
        .flatMap(({ seatingMatrix }) => seatingMatrix.flat())
        .reduce(
            (counts, seat) => {
                logger.trace(seat);
                if (seat.occupied) {
                    counts.totalAssignedSeats += 1;
                } else {
                    counts.totalEmptySeats += 1;
                }
                return counts;
            },
            { totalEmptySeats: 0, totalAssignedSeats: 0 },
        );
    logger.trace('seatData', seatData);
    return seatData;
}

// Example usage:
/* const classes = [...]; // Replace with your array of seating matrices
const seatCounts = seatCount(classes);

logger.trace("Total seat counts across all classes:");
logger.trace("Total Empty Seats:", seatCounts.totalEmptySeats);
logger.trace("Total Assigned Seats:", seatCounts.totalAssignedSeats); */
