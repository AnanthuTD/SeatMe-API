import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const ProgramCourse = sequelize.define(
        'ProgramCourse',
        {
            program_id: {
                type: DataTypes.TINYINT.UNSIGNED,
                primaryKey: true,
            },
            course_id: {
                type: DataTypes.STRING(8),
                primaryKey: true,
            },
        },
        {
            // Other model options can be added here
            tableName: 'program_course',
            timestamps: false,
            underscored: true,
        },
    );

    return ProgramCourse;
};
