import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const dateTime = sequelize.define(
        'dateTime',
        {
            date: {
                type: DataTypes.DATEONLY,
            },
            timeCode: {
                type: DataTypes.ENUM('AN', 'FN'),
                allowNull: false,
            },
        },
        {
            timestamps: false,
            underscored: true,
        },
    );

    return dateTime;
};
