import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    // Define the Department model schema
    const authUser = sequelize.define(
        'authUser',
        {
            id: {
                type: DataTypes.STRING(7),
                primaryKey: true,
                set(value) {
                    this.setDataValue(
                        'id',
                        value.replace(/[a-z]/g, (char) => char.toUpperCase()),
                    );
                },
                validate: {
                    isAlphaOrNumber(value) {
                        if (!/^[0-9A-Za-z]+$/.test(value)) {
                            throw new Error(
                                'ID must be composed of numbers or letters.',
                            );
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
            phone: { type: DataTypes.BIGINT },
            role: { type: DataTypes.ENUM(['admin', 'staff', 'invigilator']) },
            password: { type: DataTypes.STRING(72) },
            designation: { type: DataTypes.STRING(100), allowNull: true },
        },
        {
            underscored: true,
        },
    );

    return authUser;
};
