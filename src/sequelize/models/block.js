import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
    // Check if the sequelize parameter is a valid Sequelize instance
    if (!(sequelize instanceof Sequelize)) return null;

    const block = sequelize.define(
        'block',
        {
            id: {
                type: DataTypes.STRING(100),
                allowNull: false,
                set(value) {
                    this.setDataValue('id', value.toLowerCase());
                },
                primaryKey: true,
            },
        },
        {
            timestamps: false,
            underscored: true,
        },
    );

    return block;
};
