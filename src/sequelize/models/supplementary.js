import { Sequelize, DataTypes } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const supplementary = sequelize.define(
        'supplementary',
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
            },
            examId: {
                type: DataTypes.INTEGER.UNSIGNED,
            },
            studentId: {
                type: DataTypes.INTEGER.UNSIGNED,
            },
        },
        {
            timestamps: false,
            underscored: true,
            indexes: [
                {
                    unique: true,
                    fields: ['exam_id', 'student_id'],
                },
            ],
        },
    );

    return supplementary;
};
