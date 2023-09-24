import { Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const ProgramCourse = sequelize.define(
        'ProgramCourse',
        {},
        {
            // Other model options can be added here
            tableName: 'program_course',
            timestamps: false,
            underscored: true,
        },
    );
    return ProgramCourse;
};
