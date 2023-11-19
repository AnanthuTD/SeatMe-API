import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const block = sequelize.define(
        'block',
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                set(value) {
                    this.setDataValue('name', value.toLowerCase());
                },
            },
        },
        {
            timestamps: false,
            underscored: true,
        },
    );

    return block;
};
