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
    constructor({ students, room = { seatingMatrix: [[]], exams: [] } }) {
        this.students = students;
        this.seatingMatrix = room.seatingMatrix;
        this.numRows = this.seatingMatrix.length;
        this.numCols = this.seatingMatrix[0].length;
        this.room = room;
        this.classCapacity = this.numRows * this.numCols;
        this.currentRow = 0;
        this.currentCol = 0;
        this.numExams =
            this.numCols > this.students.length
                ? this.students.length
                : this.numCols;
        this.numStudentsEachExam = Math.floor(
            this.classCapacity / this.numExams,
        );
        this.balanceSeats =
            this.classCapacity - this.numStudentsEachExam * this.numExams;
        this.unassignedStudents = [];
        this.studentCount = 0;
    }

    async filterStudent() {
        this.students = await this.students.filter(
            (classStudents) => classStudents.length > 0,
        );
        // return null;
    }

    /**
     * Assign seats to students based on their exams.
     */
    async assignSeats() {
       /*  this.students = this.students.filter(
            (classStudents) => classStudents.length > 0,
        ); */

        for (let examIndex = 0; examIndex < this.numExams; examIndex += 1) {
            this.room.exams.push({
                id: this.students[examIndex][0].courseId,
                name: this.students[examIndex][0].courseName,
                examines: [],
                examId: this.students[examIndex][0].examId,
            });

            let numStudentsThisExam;

            // Calculate the remaining available seats in the current class
            const remainingSeats =
                this.numRows * this.numCols - this.studentCount;

            // Check if there are enough remaining seats for this exam
            if (
                remainingSeats >=
                this.numStudentsEachExam + this.balanceSeats
            ) {
                numStudentsThisExam =
                    this.numStudentsEachExam + this.balanceSeats;
                this.balanceSeats = 0;
            } else {
                numStudentsThisExam = remainingSeats;

                this.balanceSeats = 0; // Reset balanceSeats as all seats are assigned
            }

            if (numStudentsThisExam > this.students[examIndex].length) {
                this.balanceSeats =
                    numStudentsThisExam - this.students[examIndex].length;
                numStudentsThisExam = this.students[examIndex].length;
            }
            if (
                this.currentRow === this.numRows &&
                this.currentCol === this.numCols
            ) {
                this.currentCol = 0;
                this.currentRow = 0;
            }

            let studentIndex;
            for (
                studentIndex = 0;
                studentIndex < numStudentsThisExam;
                studentIndex += 1
            ) {
                const {
                    name,
                    courseName: exam,
                    id: regno,
                    courseId: id,
                    examId,
                } = this.students[examIndex][studentIndex];

                const seat = this.findSuitableSeat(exam);

                if (seat) {
                    this.studentCount += 1;

                    const { row, col } = seat;

                    this.seatingMatrix[row][col].occupied = true;
                    this.seatingMatrix[row][col].exam = exam;
                    this.seatingMatrix[row][col].id = id;
                    this.seatingMatrix[row][col].regno = regno;
                    this.seatingMatrix[row][col].name = name;
                    this.seatingMatrix[row][col].examId = examId;

                    this.insertRegno(id, regno, examId);

                    this.currentRow = row;
                    this.currentCol = col;
                } else {
                    // this.displaySeatingArrangement();
                    this.unassignedStudents.push(
                        this.students[examIndex][studentIndex],
                    );
                    this.balanceSeats += 1;
                }
            }
            // console.log('unassigned students : ', this.unassignedStudents);
            this.students[examIndex].splice(0, studentIndex);
            this.students[examIndex] = [
                ...this.unassignedStudents,
                ...this.students[examIndex],
            ];
            this.unassignedStudents = [];
        }
        if (this.balanceSeats) {
            console.log(`Balance seats : ${this.balanceSeats}`);
            // this.displaySeatingArrangement();
            await this.assignSeats();
        }
        if (this.studentCount <= this.numStudentsEachExam * this.numExams)
            console.log('student missing');
        // this.displaySeatingArrangement();
        assignedCount += this.studentCount;
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

        // console.log(this.room.exams);

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
        for (let col = 0; col < this.numCols; col += 1) {
            for (let row = 0; row < this.numRows; row += 1) {
                // console.log(row);
                if (
                    !this.seatingMatrix[row][col].occupied &&
                    !this.isAdjacentSeatOccupied(row, col, exam)
                ) {
                    return { row, col };
                }
            }
        }

        return null;
    }

    /**
     * Check if adjacent seats are occupied by students with the same exam.
     * @param {number} col - The row index of the seat.
     * @param {number} row - The column index of the seat.
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
                newCol >= 0 &&
                newCol < this.numCols &&
                newRow >= 0 &&
                newRow < this.numRows &&
                this.seatingMatrix[newRow][newCol].occupied &&
                this.seatingMatrix[newRow][newCol].exam === exam
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
    date = date.toISOString();
    [date] = date.split('T');
    const orderBy = 'rollNumber'; // rollNumber or id(register_number)

    /** @type {[NestedStudentArray, number]} */
    let [students, totalStudents] = await getData(date, orderBy);

    console.log(`total subjects : ${students.length}`);
    console.log(`Generated ${totalStudents} students`);

    const { classes, totalSeats } = await generateSeatingMatrix();

    console.log(
        `Generated ${classes.length} classes with a total of ${totalSeats} seats.`,
    );

    let classesIndex = 0;
    while (students.length > 0 && classesIndex < classes.length) {
        const seatingArrangement = new SeatingArrangement({
            students,
            room: classes[classesIndex],
        });

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

assignSeats();
