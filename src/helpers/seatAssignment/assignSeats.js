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
        this.numExams =
            this.numCols > this.students.length
                ? this.students.length
                : this.numCols;
        this.numStudentsEachExam = Math.floor(
            this.classCapacity / this.numExams,
        );
        this.extraStudentsNeeded =
            this.classCapacity - this.numStudentsEachExam * this.numExams;
        this.unassignedStudents = [];
        this.occupiedSeatsCount = 0;
        this.try = true;
    }

    /**
     * Assign seats to students based on their exams.
     */
    assignSeats() {
       /*  let removedEmpty = false;
        this.students = this.students.filter((classStudents) => {
            if (classStudents.length > 0) return true;
            removedEmpty = true;
            console.log('empty class students');
            return false;
        });
        if (this.students.length === 0) {
            return;
        }
        if (removedEmpty) {
            this.numExams =
                this.numCols > this.students.length
                    ? this.students.length
                    : this.numCols;
            this.numStudentsEachExam = Math.floor(
                this.classCapacity / this.numExams,
            );
            this.extraStudentsNeeded =
                this.classCapacity - this.numStudentsEachExam * this.numExams >
                0
                    ? this.classCapacity -
                      this.numStudentsEachExam * this.numExams
                    : 0;
        } */
        for (let examIndex = 0; examIndex < this.numExams; examIndex += 1) {
            this.room.exams.push({
                id: this.students[examIndex][0].courseId,
                name: this.students[examIndex][0].courseName,
                examines: [],
                examId: this.students[examIndex][0].examId,
            });

            let numStudentsThisExam;

            // Calculate the remaining available seats in the current class
            const unOccupiedSeatsCount =
                this.classCapacity - this.occupiedSeatsCount;

            // Check if there are enough remaining seats for this exam
            if (
                unOccupiedSeatsCount >=
                this.numStudentsEachExam + this.extraStudentsNeeded
            ) {
                numStudentsThisExam =
                    this.numStudentsEachExam + this.extraStudentsNeeded;
                this.extraStudentsNeeded = 0;
            } else {
                numStudentsThisExam = unOccupiedSeatsCount;

                this.extraStudentsNeeded = 0; // Reset balanceSeats as all seats are assigned
            }

            if (numStudentsThisExam > this.students[examIndex].length) {
                this.extraStudentsNeeded =
                    numStudentsThisExam - this.students[examIndex].length;
                numStudentsThisExam = this.students[examIndex].length;
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
                if (regno === 10000100079) {
                    console.log('10000100079');
                }
                if (seat) {
                    this.occupiedSeatsCount += 1;

                    const { row, col } = seat;

                    this.seatingMatrix[row][col].occupied = true;
                    this.seatingMatrix[row][col].exam = exam;
                    this.seatingMatrix[row][col].id = id;
                    this.seatingMatrix[row][col].regno = regno;
                    this.seatingMatrix[row][col].name = name;
                    this.seatingMatrix[row][col].examId = examId;

                    this.insertRegno(id, regno, examId);
                } else {
                    // this.displaySeatingArrangement();
                    this.unassignedStudents.push(
                        this.students[examIndex][studentIndex],
                    );
                    this.extraStudentsNeeded += 1;
                }
            }

            this.students[examIndex].splice(0, studentIndex);
            this.students[examIndex] = [
                ...this.unassignedStudents,
                ...this.students[examIndex],
            ];
            this.unassignedStudents = [];
        }
        if (this.extraStudentsNeeded && this.try) {
            console.log(`Balance seats : ${this.extraStudentsNeeded}`);
            this.try = false;
            const result = this.assignSeats();
            console.log(result);
        }
        if (this.occupiedSeatsCount <= this.numStudentsEachExam * this.numExams)
            console.log('student missing');
        // this.displaySeatingArrangement();
        assignedCount += this.occupiedSeatsCount;
        return true;
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

    console.log(totalAssignedSeats);

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
