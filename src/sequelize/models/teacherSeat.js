import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const teacherSeat = sequelize.define(
        'teacherSeat',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            roomId: {
                type: DataTypes.INTEGER.UNSIGNED,
            },
            dateTimeId: {
                type: DataTypes.INTEGER,
            },
            attendanceSubmitted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            timestamps: false,
            underscored: true,
            indexes: [
                {
                    unique: true,
                    fields: ['room_id', 'date_time_id'],
                },
            ],
        },
    );

    return teacherSeat;
};
