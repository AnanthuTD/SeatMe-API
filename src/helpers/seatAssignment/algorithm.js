/**
 * Class representing a seating arrangement for exams.
 */
export default class SeatingArrangement {
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
        this.occupiedSeatsCount =
            this.room?.unOccupiedSeatsCount > 0
                ? this.classCapacity - this.room.unOccupiedSeatsCount
                : 0;
        this.unOccupiedSeatsCount =
            this.room?.unOccupiedSeatsCount > 0
                ? this.room.unOccupiedSeatsCount
                : this.classCapacity;
        this.try = true;
    }

    /**
     * Assign seats to students based on their exams.
     */
    assignSeats() {
        if (this.students.length === 0) {
            return;
        }

        for (let examIndex = 0; examIndex < this.numExams; examIndex += 1) {
            let numStudentsThisExam;

            // Check if there are enough remaining seats for this exam
            if (
                this.unOccupiedSeatsCount >=
                this.numStudentsEachExam + this.extraStudentsNeeded
            ) {
                numStudentsThisExam =
                    this.numStudentsEachExam + this.extraStudentsNeeded;
                this.extraStudentsNeeded = 0;
            } else {
                numStudentsThisExam = this.unOccupiedSeatsCount;
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
                    id,
                    name,
                    courseName,
                    courseId,
                    examId,
                    programId,
                    programName,
                    semester,
                } = this.students[examIndex][studentIndex];

                const seat = this.findSuitableSeat(courseId);

                if (seat) {
                    this.occupiedSeatsCount += 1;
                    this.unOccupiedSeatsCount -= 1;

                    const { row, col } = seat;

                    this.seatingMatrix[row][col].occupied = true;
                    this.seatingMatrix[row][col].courseName = courseName;
                    this.seatingMatrix[row][col].courseId = courseId;
                    this.seatingMatrix[row][col].id = id;
                    this.seatingMatrix[row][col].name = name;
                    this.seatingMatrix[row][col].examId = examId;

                    this.updateExamines(
                        programId,
                        id,
                        examId,
                        programName,
                        semester,
                        courseId,
                    );
                } else {
                    this.unassignedStudents.push(
                        this.students[examIndex][studentIndex],
                    );
                    this.extraStudentsNeeded += 1;
                    studentIndex += 1;

                    break;
                }
            }

            this.students[examIndex].splice(0, studentIndex);
            this.students[examIndex] = [
                ...this.unassignedStudents,
                ...this.students[examIndex],
            ];
            this.unassignedStudents = [];
            if (this.unOccupiedSeatsCount <= 0) {
                break;
            }
        }
        if (this.extraStudentsNeeded && this.try) {
            this.try = false;
            this.students = this.students.filter(
                (classStudents) => classStudents.length > 0,
            );

            this.numExams =
                this.numCols > this.students.length
                    ? this.students.length
                    : this.numCols;
            this.numStudentsEachExam = Math.floor(
                this.classCapacity / this.numExams,
            );
            this.extraStudentsNeeded =
                this.classCapacity -
                this.occupiedSeatsCount -
                this.numStudentsEachExam * this.numExams;
            this.extraStudentsNeeded =
                this.extraStudentsNeeded > 0 ? this.extraStudentsNeeded : 0;

            this.assignSeats();
        }
        this.room.unOccupiedSeatsCount = this.unOccupiedSeatsCount;
    }

    updateExamines(
        programId,
        studentId,
        examId,
        programName,
        semester,
        courseId,
    ) {
        let found = false;

        this.room.exams = this.room.exams.map((element) => {
            if (element.id === programId && element.semester === semester) {
                element.examines.push(studentId);
                found = true;
            }
            return element;
        });

        // If the exam with the specified id is not found, create a new entry
        if (!found) {
            this.room.exams.push({
                id: programId,
                examId,
                examines: [studentId],
                name: programName,
                semester,
                courseId,
            });
        }
    }

    /**
     * Find a suitable seat for a student based on their exam.
     * @param {string} exam - The exam the student is taking.
     * @returns {Object|null} The seat coordinates or null if no suitable seat is found.
     */
    findSuitableSeat(courseId) {
        for (let col = 0; col < this.numCols; col += 1) {
            for (let row = 0; row < this.numRows; row += 1) {
                if (
                    !this.seatingMatrix[row][col].occupied &&
                    !this.isAdjacentSeatOccupied(row, col, courseId)
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
    isAdjacentSeatOccupied(row, col, courseId) {
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
                this.seatingMatrix[newRow][newCol].courseId === courseId
            ) {
                isAdjacentOccupied = true;
                console.error();
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

    getUnsignedStudents() {
        return this.students;
    }
}
