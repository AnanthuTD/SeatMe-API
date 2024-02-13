/**
 * Check for repeating registration numbers in the Classes array.
 * @param {Array} rooms - An array of seating matrices for all classes.
 * @returns {Array} - An array of repeating registration numbers.
 */
export default async function findRepeatingStudents(rooms) {
    const regNoSet = new Set(); // To store unique registration numbers

    // Use flatMap to flatten the nested arrays
    const allSeats = rooms.flatMap(({ seatingMatrix }) =>
        seatingMatrix.flatMap((row) => row),
    );

    // Initialize repeatingRegNos as an empty Set
    const repeatingRegNos = new Set();

    allSeats
        .filter((seat) => seat.occupied)
        .forEach((seat) => {
            const { id } = seat;
            if (regNoSet.has(id)) {
                // This registration number is repeating
                repeatingRegNos.add(id);
            } else {
                regNoSet.add(id);
            }
        });

    return Array.from(repeatingRegNos); // Convert Set back to an array
}

// Example usage:
/* const repeatingRegNos = await findRepeatingRegNos(classes);

if (repeatingRegNos.length > 0) {
    logger.debug("Repeating registration numbers found:");
    logger.debug(repeatingRegNos);
} else {
    logger.debug("No repeating registration numbers found.");
}
 */
