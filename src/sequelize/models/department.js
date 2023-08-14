import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const Department = sequelize.define(
  'Department',
  {
    id: {
      type: DataTypes.TINYINT.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    // Other model options go here
  },
);

export default Department;
