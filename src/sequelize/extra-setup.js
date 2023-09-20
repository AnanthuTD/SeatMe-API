import { Sequelize } from 'sequelize';

const applyExtraSetup = (sequelize) => {
    if (!(sequelize instanceof Sequelize))
        throw new Error('not a Sequelize instance');

    const {
        Department,
        AuthUser,
        Program,
        Room,
        Block,
        Course,
        StudentSeat,
        Student,
        TimeTable,
        DateTime,
        TeacherSeat,
        Supplementary,
        ProgramCourse,
    } = sequelize.models;

    AuthUser.belongsTo(Department);
    Department.hasMany(AuthUser);

    Program.belongsTo(Department);
    Department.hasMany(Program);

    Room.belongsTo(Block);
    Block.hasMany(Room);

    Program.belongsToMany(Course, { through: ProgramCourse });
    Course.belongsToMany(Program, { through: ProgramCourse });

    StudentSeat.belongsTo(Room);
    Room.hasMany(StudentSeat);
    Student.hasMany(StudentSeat);
    StudentSeat.belongsTo(Student);
    Room.belongsToMany(Student, { through: StudentSeat });
    Student.belongsToMany(Room, { through: StudentSeat });
    StudentSeat.hasOne(TimeTable);

    TimeTable.hasOne(Course);
    Course.hasMany(TimeTable);
    TimeTable.hasOne(DateTime);
    DateTime.hasMany(TimeTable);

    Room.belongsToMany(AuthUser, { through: TeacherSeat });
    AuthUser.belongsToMany(Room, { through: TeacherSeat });
    TeacherSeat.belongsTo(Room);
    Room.hasMany(TeacherSeat);
    AuthUser.hasMany(TeacherSeat);
    TeacherSeat.belongsTo(AuthUser);

    Student.hasMany(Supplementary);
    Supplementary.belongsTo(Student);
    Program.hasMany(Supplementary);
    Supplementary.belongsTo(Program);
    Course.hasMany(Supplementary);
    Supplementary.belongsTo(Course);
    ProgramCourse.hasMany(Supplementary);
    Supplementary.belongsTo(ProgramCourse, {
        foreignKey: {
            name: 'program_id',
            allowNull: false,
        },
        targetKey: 'program_id',
    });
    Supplementary.belongsTo(ProgramCourse, {
        foreignKey: {
            name: 'course_id',
            allowNull: false,
        },
        targetKey: 'course_id',
    });

    Student.belongsToMany(Course, { through: ProgramCourse });
    Course.belongsToMany(Student, { through: ProgramCourse });
    Course.hasMany(ProgramCourse);
    ProgramCourse.belongsTo(Course);
    Program.hasMany(Student);
    Student.belongsTo(Program);
};
export { applyExtraSetup };
