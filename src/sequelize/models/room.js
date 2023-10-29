import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const room = sequelize.define(
        'room',
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
            },
            cols: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },
            rows: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },
            isAvailable: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            floor: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },
            blockId: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },
        },
        {
            timestamps: false,
            underscored: true,
        },
    );

    return room;
};
