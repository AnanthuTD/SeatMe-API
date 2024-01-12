import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    // Define the program model schema
    const course = sequelize.define(
        'course',
        {
            id: {
                type: DataTypes.STRING(100),
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            type: {
                type: DataTypes.ENUM([
                    'core',
                    'common',
                    'complementary',
                    'optional',
                    'elective',
                    'open',
                    'skill',
                    'general',
                    'project',
                    'vocational',
                    'choice',
                    'language',
                ]),
                allowNull: true,
            },
            semester: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },
        },
        {
            timestamps: false,
            underscored: true,
        },
    );

    return course;
};
