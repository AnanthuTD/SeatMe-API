import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const Supplementary = sequelize.define(
        'Supplementary',
        {},
        {
            // Other model options can be added here
            tableName: 'supplementary',
            timestamps: false,
            underscored: true,
        },
    );

    return Supplementary;
};
