import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const DateTime = sequelize.define(
        'DateTime',
        {
            date: {
                type: DataTypes.DATEONLY,
            },
            time_code: {
                type: DataTypes.ENUM('AN', 'FN'),
                allowNull: false,
            },
        },
        {
            // Other model options can be added here
            tableName: 'date_time',
            timestamps: false,
            underscored: true,
        },
    );

    return DateTime;
};
