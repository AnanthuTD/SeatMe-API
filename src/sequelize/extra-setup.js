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

    studentSeat.belongsTo(room);
    room.hasMany(studentSeat);
    student.hasMany(studentSeat);
    studentSeat.belongsTo(student);
    /*    room.belongsToMany(student, { through: studentSeat });
    student.belongsToMany(room, { through: studentSeat }); */
    course.hasMany(studentSeat);
    studentSeat.belongsTo(course);

    dateTime.hasMany(course);
    course.belongsTo(dateTime);

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
