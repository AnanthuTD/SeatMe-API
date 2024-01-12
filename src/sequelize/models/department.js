import { DataTypes, Sequelize } from 'sequelize';

const department = (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    // Define the department model schema
    return sequelize.define(
        'department',
        {
            id: {
                type: DataTypes.TINYINT.UNSIGNED,
                unique: true,
            },
            code: {
                type: DataTypes.STRING(20),
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
        },
        {
            timestamps: false,
            underscored: true,
        },
    );
};

export default department;
