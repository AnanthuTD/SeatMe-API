import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
  // Check if the sequelize parameter is a valid Sequelize instance
  if (!(sequelize instanceof Sequelize)) return null;

  // Define the program model schema
  const Program = sequelize.define(
    'Program',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      duration: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
      },

      level: {
        type: DataTypes.STRING(5),
        allowNull: false,
      },
    },
    {
      // Other model options can be added here
      tableName: 'program',
    },
  );

  return Program;
};
