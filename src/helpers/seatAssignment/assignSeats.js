import findRepeatingRegNos from './findRepeatingRegno.js';
import getData from './getData.js';
import generateSeatingMatrixHTML from './htmlSeatingMatrix.js';
import seatCount from './seatCount.js';
import generateSeatingMatrix from './seatingMatrix.js';

let assignedCount = 0;

/**
 * Class representing a seating arrangement for exams.
 */
class SeatingArrangement {
    /**
     * Create a SeatingArrangement instance.
     * @param {Array} students - An array of students.
     * @param {Object} room
     * @param {number} numRows - The number of rows in the seating matrix.
     * @param {number} numCols - The number of columns in the seating matrix.
     */
    constructor(students, room, numRows, numCols) {
        this.students = students;
        this.numRows = numRows;
        this.numCols = numCols;
        this.room = room;
        this.classCapacity = this.numRows * this.numCols;
        this.seatingMatrix = room.seatingMatrix;
        this.currentRow = 0;
        this.currentCol = 0;
        this.numExams =
            this.numCols > this.students.length
                ? this.students.length
                : this.numCols;
        this.numStudentsEachExam = Math.floor(
            this.classCapacity / this.numExams,
        );
        /* console.log(`\nclassCapacity: ${this.classCapacity}`);
        console.log(
            `total students: ${this.numStudentsEachExam * this.numExams}`,
        ); */
        this.balanceSeats = 0;
        this.unassignedStudents = [];
    }

    /**
     * Assign seats to students based on their exams.
     */
    async assignSeats() {
        let studentCount = 0;
        for (let i = 0; i < this.numExams; i += 1) {
            this.room.exams.push({
                id: this.students[i][0].courseId,
                name: this.students[i][0].courseName,
                examines: [],
                examId: this.students[i][0].examId,
            });

            let numStudentsThisExam;

            // Calculate the remaining available seats in the current class
            const remainingSeats = this.numRows * this.numCols - studentCount;

            if (
                remainingSeats >=
                this.numStudentsEachExam + this.balanceSeats
            ) {
                numStudentsThisExam =
                    this.numStudentsEachExam + this.balanceSeats;
                this.balanceSeats = 0;
                // console.log(`numStudentsThisExam: ${numStudentsThisExam}`);
            } else {
                // If there aren't enough remaining seats, assign the remaining ones
                numStudentsThisExam = remainingSeats;
                // console.log(`numStudentsThisExam: ${numStudentsThisExam}`);

                this.balanceSeats = 0; // Reset balanceSeats as all seats are assigned
            }

            if (numStudentsThisExam > this.students[i].length) {
                this.balanceSeats =
                    numStudentsThisExam - this.students[i].length;
                numStudentsThisExam = this.students[i].length;
                // console.log(`numStudentsThisExam: ${numStudentsThisExam}`);
            }
            if (
                this.currentRow === this.numRows &&
                this.currentCol === this.numCols
            ) {
                this.currentCol = 0;
                this.currentRow = 0;
            }
            let j;
            // console.log(`thisExam: ${numStudentsThisExam}`);
            for (j = 0; j < numStudentsThisExam; j += 1) {
                studentCount += 1;
                // if (student_count > this.classCapacity) break;

                const {
                    name,
                    courseName: exam,
                    id: regno,
                    courseId: id,
                    examId,
                } = this.students[i][j];
                const seat = this.findSuitableSeat(exam);

                if (seat) {
                    const { row, col } = seat;

                    this.seatingMatrix[col][row].occupied = true;
                    this.seatingMatrix[col][row].exam = exam;
                    this.seatingMatrix[col][row].id = id;
                    this.seatingMatrix[col][row].regno = regno;
                    this.seatingMatrix[col][row].name = name;
                    this.seatingMatrix[col][row].examId = examId;

                    this.insertRegno(id, regno, examId);

                    this.currentRow = col;
                    this.currentCol = row;

                    /* console.log(
                        `${studentCount}) Assigned ${name} (Reg No: ${regno}, Exam: ${exam}) to Row ${
                            row + 1
                        }, Col ${col + 1}`,
                    ); */
                } else {
                    /*  console.log(
                        `${studentCount}) No available seat for ${name} (Reg No: ${regno}, Exam: ${exam})`,
                    ); */

                    // this.displaySeatingArrangement();
                    if (this.swapSeats(exam, id, regno, examId)) {
                        // console.log('Swapping successfully done');
                    } else {
                        this.unassignedStudents.push(this.students[i][j]);
                    }
                }
            }
            // console.log('unassigned students : ', this.unassignedStudents);
            this.students[i].splice(0, j);
            this.students[i] = [
                ...this.students[i],
                ...this.unassignedStudents,
            ];
            this.unassignedStudents = [];
            // console.log(this.students[i]);
        }
        if (this.balanceSeats) {
            console.log(`Balance seats : ${this.balanceSeats}`);
        }
        if (studentCount !== this.numStudentsEachExam * this.numExams)
            console.log('student missing');
        // this.displaySeatingArrangement();
        assignedCount += studentCount;
    }

    /**
     * Attempt to swap seats for a student with another student of a different exam.
     * @param {string} exam - The exam of the student to be swapped.
     * @param {string} id - The ID of the student to be swapped.
     * @returns {boolean} True if swapping is successful, false otherwise.
     */
    swapSeats(exam, id, regno, examId) {
        for (let i = 0; i < this.numRows; i += 1) {
            for (let j = 0; j < this.numCols; j += 1) {
                if (
                    this.seatingMatrix[j][i].exam !== exam &&
                    !this.isAdjacentSeatOccupied(i, j, exam)
                ) {
                    const swappedExam = {
                        exam: this.seatingMatrix[j][i].exam,
                        occupied: this.seatingMatrix[j][i].occupied,
                        id: this.seatingMatrix[j][i].id,
                        regno: this.seatingMatrix[j][i].regno,
                        examId: this.seatingMatrix[j][i].examId,
                    };

                    this.seatingMatrix[j][i] = {
                        exam,
                        occupied: true,
                        id,
                        regno,
                    };
                    this.insertRegno(id, regno, examId);

                    const seat = this.findSuitableSeat(swappedExam.exam);

                    if (seat) {
                        const { row, col } = seat;
                        this.seatingMatrix[col][row] = swappedExam;
                        return true;
                    }
                    this.swapSeats(
                        swappedExam.exam,
                        swappedExam.id,
                        swappedExam.examId,
                    );
                }
            }
        }
        return false; // Swapping failed
    }

    insertRegno(id, regno, examId) {
        let found = false;

        this.room.exams = this.room.exams.map((element) => {
            if (element.id === id) {
                // If the exam with the specified id is found, add the regno
                element.examines.push(regno);
                found = true;
            }
            return element; // Return the modified or unmodified element
        });

        console.log(this.room.exams);

        // If the exam with the specified id is not found, create a new entry
        if (!found) {
            this.room.exams.push({
                id,
                examId,
                examines: [regno],
            });
        }
    }

    /**
     * Find a suitable seat for a student based on their exam.
     * @param {string} exam - The exam the student is taking.
     * @returns {Object|null} The seat coordinates or null if no suitable seat is found.
     */
    findSuitableSeat(exam) {
        let hasCompletedCycle = false;

        for (let row = this.currentRow; ; row = (row + 1) % this.numRows) {
            for (
                let col = row === this.currentRow ? this.currentCol : 0;
                col < this.numCols;
                col += 1
            ) {
                if (
                    !this.seatingMatrix[col][row].occupied &&
                    !this.isAdjacentSeatOccupied(row, col, exam)
                ) {
                    return { row, col };
                }
            }

            if (row === (this.currentRow + 1) % this.numRows) {
                if (hasCompletedCycle) {
                    return null; // No suitable seat found after completing a full cycle
                }
                hasCompletedCycle = true;
            }
        }
    }

    /**
     * Check if adjacent seats are occupied by students with the same exam.
     * @param {number} row - The row index of the seat.
     * @param {number} col - The column index of the seat.
     * @param {string} exam - The exam the student is taking.
     * @returns {boolean} True if adjacent seats are occupied by the same exam, false otherwise.
     */
    isAdjacentSeatOccupied(row, col, exam) {
        const adjacentOffsets = [
            [0, -1],
            [0, 1],
        ];

        let isAdjacentOccupied = false;

        adjacentOffsets.forEach(([dx, dy]) => {
            const newRow = row + dx;
            const newCol = col + dy;

            if (
                newRow >= 0 &&
                newRow < this.numRows &&
                newCol >= 0 &&
                newCol < this.numCols &&
                this.seatingMatrix[newCol][newRow].occupied &&
                this.seatingMatrix[newCol][newRow].exam === exam
            ) {
                isAdjacentOccupied = true;
            }
        });

        return isAdjacentOccupied;
    }

    /**
     * Display the seating arrangement.
     */
    displaySeatingArrangement() {
        for (let i = 0; i < this.numRows; i += 1) {
            console.log(
                this.seatingMatrix[i]
                    .map((seat) => (seat.occupied ? `${seat.id}` : 'O'))
                    .join(' '),
            );
        }
        this.room.exams.forEach((exam) => console.log(exam));
    }
}

async function assignSeats() {
    let date = new Date();
    // date.setDate(date.getDate() + 1);
    date = date.toISOString();
    [date] = date.split('T');
    const orderBy = 'rollNumber'; // rollNumber or id(register_number)
    // eslint-disable-next-line prefer-const
    let { exams: students, totalStudents } = await getData(date, orderBy);

    console.log(`total subjects : ${students.length}`);
    console.log(`Generated ${totalStudents} students`);

    const { classes, totalSeats } = await generateSeatingMatrix();

    console.log(
        `Generated ${classes.length} classes with a total of ${totalSeats} seats.`,
    );

    let classesIndex = 0;
    while (students.length > 0 && classesIndex < classes.length) {
        const seatingArrangement = new SeatingArrangement(
            students,
            classes[classesIndex],
            classes[classesIndex].seatingMatrix.length,
            classes[classesIndex].seatingMatrix[0].length,
        );

        try {
            console.log(`\nClass : ${classesIndex}\n`);
            seatingArrangement.assignSeats();
        } catch (error) {
            console.error(error.message);
        }
        students = students.filter((classStudents) => classStudents.length > 0);

        classesIndex += 1;
    }
    if (students.length === 0) console.log('All students assigned');
    else {
        const unassignedCounts = students.map(
            (classStudents) =>
                classStudents.filter((student) => !student.assigned).length,
        );

        console.log(
            `${unassignedCounts} students have not been assigned. Add more classes to assign.`,
        );
    }

    const repeatingRegNos = findRepeatingRegNos(classes);

    if (repeatingRegNos.length > 0) {
        console.log('Repeating registration numbers found:');
        console.log(repeatingRegNos);
    } else {
        console.log('No repeating registration numbers found.');
    }

    const { totalEmptySeats, totalAssignedSeats } = seatCount(classes);
    const totalNotAssignedStudents = totalStudents - totalAssignedSeats;
    if (totalAssignedSeats === totalStudents) {
        console.log('All students have been assigned');
    } else
        console.warn(
            `${totalNotAssignedStudents} students are not been assigned`,
        );

    console.log(assignedCount);

    generateSeatingMatrixHTML(
        classes,
        totalStudents,
        totalAssignedSeats,
        totalEmptySeats,
        totalNotAssignedStudents,
    );

    return classes;
}

export { assignSeats };
