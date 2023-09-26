import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    // Define the Department model schema
    const authUser = sequelize.define(
        'authUser',
        {
            id: {
                type: DataTypes.STRING(6),
                primaryKey: true,
                validate: {
                    isSixDigit(value) {
                        if (!/^[0-9A-Z]{6}$/.test(value)) {
                            throw new Error('ID must be a six-digit number.');
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
            phone: { type: DataTypes.BIGINT, allowNull: false },
            isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
            password: { type: DataTypes.STRING(72), allowNull: false },
            designation: { type: DataTypes.STRING(100), allowNull: false },
        },
        {
            underscored: true,
        },
    );

    return authUser;
};
