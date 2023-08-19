import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize) => {
  // Check if the sequelize parameter is a valid Sequelize instance
  if (!(sequelize instanceof Sequelize)) return null;

  // Define the Department model schema
  const AuthUser = sequelize.define(
    'AuthUser',
    {
      id: {
        type: DataTypes.MEDIUMINT.UNSIGNED,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(320),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone: { type: DataTypes.BIGINT, allowNull: false },
      is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      password: { type: DataTypes.STRING(72), allowNull: false },
      designation: { type: DataTypes.STRING(100), allowNull: false },
    },
    {
      // Other model options can be added here
      tableName: 'auth_user',
    },
  );

  return AuthUser;
};
