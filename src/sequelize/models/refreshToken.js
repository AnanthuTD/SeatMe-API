import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const refreshToken = sequelize.define(
        'refreshToken',
        {
            token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
        },
        {
            underscored: true,
        },
    );

    return refreshToken;
};
