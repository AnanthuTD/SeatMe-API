import { Sequelize } from 'sequelize';

const applyExtraSetup = (sequelize) => {
    if (!(sequelize instanceof Sequelize))
        throw new Error('not a Sequelize instance');

    const {
        department,
        authUser,
        program,
        room,
        block,
        course,
        studentSeat,
        student,
        dateTime,
        teacherSeat,
        supplementary,
        programCourse,
        exam,
    } = sequelize.models;

    authUser.belongsTo(department);
    department.hasMany(authUser);

    department.hasMany(program);
    program.belongsTo(department);

    room.belongsTo(block);
    block.hasMany(room);

    program.belongsToMany(course, { through: programCourse });
    program.hasMany(programCourse);
    programCourse.belongsTo(program);
    course.belongsToMany(program, { through: programCourse });
    course.hasMany(programCourse);
    programCourse.belongsTo(course);

    // open course
    student.belongsTo(course, {
        scope: {
            isOpenCourse: 1,
        },
        foreignKey: 'openCourseId',
    });
    course.hasMany(student, {
        foreignKey: 'openCourseId',
    });

    studentSeat.belongsTo(room);
    room.hasMany(studentSeat);
    student.hasMany(studentSeat, { foreignKey: 'studentId' });
    studentSeat.belongsTo(student, { foreignKey: 'studentId' });
    studentSeat.belongsTo(exam, { foreignKey: 'examId', onDelete: 'CASCADE' });
    exam.hasMany(studentSeat, { foreignKey: 'examId' });

    dateTime.belongsToMany(course, { through: exam });
    course.belongsToMany(dateTime, { through: exam });
    exam.belongsTo(dateTime);
    dateTime.hasMany(exam);
    exam.belongsTo(course);
    course.hasMany(exam);

    room.belongsToMany(authUser, { through: teacherSeat });
    authUser.belongsToMany(room, { through: teacherSeat });
    teacherSeat.belongsTo(room);
    room.hasMany(teacherSeat);
    authUser.hasMany(teacherSeat);
    teacherSeat.belongsTo(authUser);

    student.hasMany(supplementary);
    supplementary.belongsTo(student);
    program.hasMany(supplementary);
    supplementary.belongsTo(program);
    course.hasMany(supplementary);
    supplementary.belongsTo(course);
    // programCourse.hasMany(supplementary);
    /*  supplementary.belongsTo(programCourse, {
        foreignKey: {
            name: 'program_id',
            allowNull: false,
        },
        targetKey: 'program_id',
    });
    supplementary.belongsTo(programCourse, {
        foreignKey: {
            name: 'course_id',
            allowNull: false,
        },
        targetKey: 'course_id',
    }); */

    // student.belongsToMany(course, { through: programCourse });
    // course.belongsToMany(student, { through: programCourse });
    program.hasMany(student);
    student.belongsTo(program);
};
export { applyExtraSetup };
