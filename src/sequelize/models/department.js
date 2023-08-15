import { DataTypes, Sequelize } from 'sequelize';

/**
 * Define the Department model using Sequelize.
 *
 * @param {Sequelize} sequelize - The Sequelize instance to associate with the model.
 * @returns {Model|null} The Department model if the sequelize parameter is valid, otherwise null.
 */
const Department = (sequelize) => {
  // Check if the sequelize parameter is a valid Sequelize instance
  if (!(sequelize instanceof Sequelize)) return null;

  // Define the Department model schema
  return sequelize.define(
    'Department',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      timestamps: false,
    },
  );
};

export default Department;
