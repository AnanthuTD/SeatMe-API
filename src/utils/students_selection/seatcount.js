/**
 * Check the count of empty and assigned seats in all classes.
 * @param {Array} classes - An array of seating matrices for all classes.
 * @returns {Object} - An object containing the total counts for all classes.
 */
export default function seatCount(classes) {
    const seatData = classes
        .flatMap((seatingMatrix) => seatingMatrix.flat())
        .reduce(
            (counts, seat) => {
                if (seat.occupied) {
                    counts.totalAssignedSeats += 1;
                } else {
                    counts.totalEmptySeats += 1;
                }
                return counts;
            },
            { totalEmptySeats: 0, totalAssignedSeats: 0 },
        );

    return seatData;
}

// Example usage:
/* const classes = [...]; // Replace with your array of seating matrices
const seatCounts = seatCount(classes);

console.log("Total seat counts across all classes:");
console.log("Total Empty Seats:", seatCounts.totalEmptySeats);
console.log("Total Assigned Seats:", seatCounts.totalAssignedSeats); */
