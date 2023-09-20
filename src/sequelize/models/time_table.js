import { Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const TimeTable = sequelize.define(
        'TimeTable',
        {},
        {
            // Other model options can be added here
            tableName: 'time_table',
            underscored: true,
        },
    );

    return TimeTable;
};
