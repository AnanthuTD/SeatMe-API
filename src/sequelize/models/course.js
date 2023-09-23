import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    // Define the program model schema
    const Course = sequelize.define(
        'Course',
        {
            id: {
                type: DataTypes.STRING(9),
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            semester: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },
        },
        {
            // Other model options can be added here
            tableName: 'course',
            timestamps: false,
            underscored: true,
        },
    );

    return Course;
};
