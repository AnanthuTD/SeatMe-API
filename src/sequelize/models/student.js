import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const student = sequelize.define(
        'student',
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
            rollNumber: {
                type: DataTypes.INTEGER.UNSIGNED,
                unique: true,
                validate: {
                    isSixDigitNumber(value) {
                        if (!/^\d{6}$/.test(value)) {
                            throw new Error('ID must be a 6-digit number.');
                        }
                    },
                },
                allowNull: false,
            },
            semester: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(320),
                allowNull: true,
                validate: {
                    isEmail: true,
                },
            },
            phone: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        },
        {
            underscored: true,
        },
    );

    return student;
};
