import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const studentSeat = sequelize.define(
        'studentSeat',
        {
            seatNumber: {
                type: DataTypes.INTEGER.UNSIGNED,
            },
            studentId: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            examId: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
            },
            isPresent: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            timestamps: false,
            underscored: true,
            indexes: [
                {
                    unique: true,
                    fields: ['student_id', 'exam_id'],
                },
            ],
        },
    );

    return studentSeat;
};
