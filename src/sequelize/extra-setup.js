import { Sequelize } from 'sequelize';

const applyExtraSetup = (sequelize) => {
  if (!(sequelize instanceof Sequelize))
    throw new Error('not a Sequelize instance');

  const { Department, AuthUser } = sequelize.models;

  AuthUser.belongsTo(Department);
  Department.hasMany(AuthUser);
};
export { applyExtraSetup };
