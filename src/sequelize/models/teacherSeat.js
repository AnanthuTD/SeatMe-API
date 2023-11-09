import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const teacherSeat = sequelize.define(
        'teacherSeat',
        {
            roomId: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
            },
            dateTimeId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
        },
        {
            timestamps: false,
            underscored: true,
        },
    );

    return teacherSeat;
};
