import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    // Define the program model schema
    const Program = sequelize.define(
        'Program',
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
            },
            duration: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },

            level: {
                type: DataTypes.STRING(5),
                allowNull: false,
            },
        },
        {
            // Other model options can be added here
            tableName: 'program',
        },
    );

    return Program;
};
