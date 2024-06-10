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
            programId: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
                set() {
                    // Calculate programId from the third and fourth digits of rollNumber
                    const rollNumberStr =
                        this.getDataValue('rollNumber').toString();
                    const programIdDigits = rollNumberStr.slice(2, 4);
                    this.setDataValue(
                        'programId',
                        parseInt(programIdDigits, 10),
                    );
                },
            },
            semester: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 8,
                },
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
                set(value) {
                    if (!value || value.trim() === '') {
                        this.setDataValue('email', null);
                    } else {
                        this.setDataValue('email', value);
                    }
                },
            },
            phone: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        },
        {
            underscored: true,
        },
    );

    student.beforeBulkCreate((instances) => {
        instances.forEach((instance) => {
            const rollNumberStr = instance.rollNumber.toString();
            const programIdDigits = rollNumberStr.slice(2, 4);
            instance.programId = parseInt(programIdDigits, 10);
        });
    });

    return student;
};
