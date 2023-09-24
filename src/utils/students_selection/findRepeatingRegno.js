/**
 * Check for repeating registration numbers in the Classes array.
 * @param {Array} classes - An array of seating matrices for all classes.
 * @returns {Array} - An array of repeating registration numbers.
 */
export default async function findRepeatingRegNos(classes) {
    const regNoSet = new Set(); // To store unique registration numbers

    // Use flatMap to flatten the nested arrays
    const allSeats = classes.flatMap((seatingMatrix) =>
        seatingMatrix.flatMap((row) => row),
    );

    // Initialize repeatingRegNos as an empty Set
    const repeatingRegNos = new Set();

    await allSeats
        .filter((seat) => seat.occupied)
        .forEach((seat) => {
            const { regno } = seat;
            if (regNoSet.has(regno)) {
                // This registration number is repeating
                repeatingRegNos.add(regno);
            } else {
                regNoSet.add(regno);
            }
        });

    return Array.from(repeatingRegNos); // Convert Set back to an array
}

// Example usage:
/* const repeatingRegNos = await findRepeatingRegNos(classes);

if (repeatingRegNos.length > 0) {
    console.log("Repeating registration numbers found:");
    console.log(repeatingRegNos);
} else {
    console.log("No repeating registration numbers found.");
}
 */
