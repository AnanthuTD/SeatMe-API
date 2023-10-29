import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    // Define the program model schema
    const course = sequelize.define(
        'course',
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
            isOpenCourse: {
                type: DataTypes.TINYINT(1),
                defaultValue: false,
            },
        },
        {
            timestamps: false,
            /*  defaultScope: {
                where: {
                    isOpenCourse: false,
                },
            }, */
        },
    );

    return course;
};
