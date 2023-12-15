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
        refreshToken,
    } = sequelize.models;

    refreshToken.belongsTo(authUser, { foreignKey: 'authUserId' });
    authUser.hasMany(refreshToken, { foreignKey: 'authUserId' });

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
            type: 'open',
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

    room.belongsToMany(dateTime, { through: teacherSeat });
    dateTime.belongsToMany(room, { through: teacherSeat });
    teacherSeat.belongsTo(room);
    room.hasMany(teacherSeat);
    teacherSeat.belongsTo(authUser);
    dateTime.hasMany(teacherSeat);
    authUser.hasMany(teacherSeat);
    teacherSeat.belongsTo(dateTime);
    authUser.hasMany(teacherSeat);
    teacherSeat.belongsTo(authUser);

    student.hasMany(supplementary);
    supplementary.belongsTo(student);
    program.hasMany(supplementary);
    supplementary.belongsTo(program);
    course.hasMany(supplementary);
    supplementary.belongsTo(course);

    program.hasMany(student, { foreignKey: 'programId' });
    student.belongsTo(program, { foreignKey: 'programId' });
};
export { applyExtraSetup };
