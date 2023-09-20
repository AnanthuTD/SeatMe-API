import { Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const TeacherSeat = sequelize.define(
        'TeacherSeat',
        {},
        {
            // Other model options can be added here
            tableName: 'teacher_seat',
            timestamps: false,
            underscored: true,
        },
    );

    return TeacherSeat;
};
