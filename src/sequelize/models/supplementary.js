import { Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const supplementary = sequelize.define(
        'supplementary',
        {},
        {
            timestamps: false,
            underscored: true,
        },
    );

    return supplementary;
};
