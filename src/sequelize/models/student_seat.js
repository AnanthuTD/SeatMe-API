import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const StudentSeat = sequelize.define(
        'StudentSeat',
        {
            seat_number: {
                type: DataTypes.INTEGER.UNSIGNED,
            },
            is_present: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            // Other model options can be added here
            tableName: 'student_seat',
            timestamps: false,
            underscored: true,
        },
    );

    return StudentSeat;
};
