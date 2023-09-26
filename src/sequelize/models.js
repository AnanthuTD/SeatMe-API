import { sequelize } from './connection.js';
import { applyExtraSetup } from './extra-setup.js';
import department from './models/department.js';
import authUser from './models/authUser.js';
import program from './models/program.js';
import course from './models/course.js';
import block from './models/block.js';
import room from './models/room.js';
import student from './models/student.js';
import supplementary from './models/supplementary.js';
import programCourse from './models/programCourse.js';
import studentSeat from './models/studentSeat.js';
import dateTime from './models/dateTime.js';
import teacherSeat from './models/teacherSeat.js';

const models = {
    department: department(sequelize),
    authUser: authUser(sequelize),
    program: program(sequelize),
    course: course(sequelize),
    block: block(sequelize),
    room: room(sequelize),
    student: student(sequelize),
    supplementary: supplementary(sequelize),
    programCourse: programCourse(sequelize),
    studentSeat: studentSeat(sequelize),
    dateTime: dateTime(sequelize),
    teacherSeat: teacherSeat(sequelize),
};

applyExtraSetup(sequelize);

export { models, sequelize };
