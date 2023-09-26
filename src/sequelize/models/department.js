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
                primaryKey: true,
                validate: {
                    isTwoDigitNumber(value) {
                        if (!/^\d{2}$/.test(value)) {
                            throw new Error('ID must be a 2-digit number.');
                        }
                    },
                },
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
