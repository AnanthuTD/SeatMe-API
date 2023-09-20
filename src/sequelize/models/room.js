import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const Room = sequelize.define(
        'Room',
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
            is_available: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            floor: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false,
            },
        },
        {
            // Other model options can be added here
            tableName: 'room',
            timestamps: false,
            underscored: true,
        },
    );

    return Room;
};
