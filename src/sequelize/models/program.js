import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    // Define the program model schema
    const program = sequelize.define(
        'program',
        {
            id: {
                type: DataTypes.TINYINT.UNSIGNED,
                primaryKey: true,
                /*  validate: {
                    isTwoDigitNumber(value) {
                        if (!/^\d{2}$/.test(value)) {
                            throw new Error('ID must be a 2-digit number.');
                        }
                    },
                }, */
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
                type: DataTypes.ENUM(['UG', 'PG']),
                allowNull: false,
            },
            isAided: {
                type: DataTypes.BOOLEAN,
                defaultValue: 1,
            },
            hasOpenCourse: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            timestamps: false,
            underscored: true,
        },
    );

    return program;
};
