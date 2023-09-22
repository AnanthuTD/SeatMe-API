import { sequelize } from './connection.js';
import { applyExtraSetup } from './extra-setup.js';
import Department from './models/department.js';
import AuthUser from './models/auth_user.js';
import Program from './models/program.js';
import Course from './models/course.js';
import Block from './models/block.js';
import Room from './models/room.js';
import Student from './models/student.js';
import Supplementary from './models/supplementary.js';
import ProgramCourse from './models/program_course.js';
import StudentSeat from './models/student_seat.js';
// import TimeTable from './models/time_table.js';
import DateTime from './models/date_time.js';
import TeacherSeat from './models/teacher_seat.js';

const models = {
    Department: Department(sequelize),
    AuthUser: AuthUser(sequelize),
    Program: Program(sequelize),
    Course: Course(sequelize),
    Block: Block(sequelize),
    Room: Room(sequelize),
    Student: Student(sequelize),
    Supplementary: Supplementary(sequelize),
    ProgramCourse: ProgramCourse(sequelize),
    StudentSeat: StudentSeat(sequelize),
    // TimeTable: TimeTable(sequelize),
    DateTime: DateTime(sequelize),
    TeacherSeat: TeacherSeat(sequelize),
};

applyExtraSetup(sequelize);

export { models, sequelize };
