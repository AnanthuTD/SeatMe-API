import { Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const teacherSeat = sequelize.define(
        'teacherSeat',
        {},
        {
            timestamps: false,
            underscored: true,
        },
    );

    return teacherSeat;
};
