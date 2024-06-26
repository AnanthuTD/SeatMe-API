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
        bannedStudent,
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

    // second language sem 1
    student.belongsTo(course, {
        scope: {
            type: 'common2',
        },
        foreignKey: 'secondLang_1',
    });
    course.hasMany(student, {
        foreignKey: 'secondLang_1',
    });

    // second language sem 2
    student.belongsTo(course, {
        scope: {
            type: 'common2',
        },
        foreignKey: 'secondLang_2',
    });
    course.hasMany(student, {
        foreignKey: 'secondLang_2',
    });
    // second language sem 3
    student.belongsTo(course, {
        scope: {
            type: 'common2',
        },
        foreignKey: 'secondLang_3',
    });
    course.hasMany(student, {
        foreignKey: 'secondLang_3',
    });
    // second language sem 4
    student.belongsTo(course, {
        scope: {
            type: 'common2',
        },
        foreignKey: 'secondLang_4',
    });
    course.hasMany(student, {
        foreignKey: 'secondLang_4',
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

    student.hasMany(supplementary, { foreignKey: 'studentId' });
    supplementary.belongsTo(student, { foreignKey: 'studentId' });
    exam.hasMany(supplementary, { foreignKey: 'examId' });
    supplementary.belongsTo(exam, { foreignKey: 'examId' });

    program.hasMany(student, { foreignKey: 'programId' });
    student.belongsTo(program, { foreignKey: 'programId' });

    student.hasOne(bannedStudent, { foreignKey: 'studentId' });
    bannedStudent.belongsTo(student, { foreignKey: 'studentId' });
};
export { applyExtraSetup };
