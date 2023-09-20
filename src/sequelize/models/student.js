import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const Student = sequelize.define(
        'Student',
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                validate: {
                    isTwelveDigitNumber(value) {
                        if (!/^\d{12}$/.test(value)) {
                            throw new Error('ID must be a 12-digit number.');
                        }
                    },
                },
            },
            roll_number: {
                type: DataTypes.INTEGER.UNSIGNED,
                unique: true,
                validate: {
                    isSixDigitNumber(value) {
                        if (!/^\d{6}$/.test(value)) {
                            throw new Error('ID must be a 6-digit number.');
                        }
                    },
                },
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(320),
                allowNull: false,
                validate: {
                    isEmail: true,
                },
            },
            phone: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        },
        {
            // Other model options can be added here
            tableName: 'student',
            underscored: true,
        },
    );

    return Student;
};
