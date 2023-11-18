import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    if (!(sequelize instanceof Sequelize)) return null;

    const seatingTimeConfig = sequelize.define(
        'seatingTimeConfig',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            day: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            startTime: {
                type: DataTypes.TIME,
                allowNull: false,
            },
            endTime: {
                type: DataTypes.TIME,
                allowNull: false,
            },
            timeCode: {
                type: DataTypes.ENUM('AN', 'FN'),
                defaultValue: 'AN',
            },
        },
        {
            timestamps: false,
            underscored: true,
            indexes: [
                {
                    unique: true,
                    fields: ['day', 'time_code'],
                },
            ],
        },
    );

    return seatingTimeConfig;
};
