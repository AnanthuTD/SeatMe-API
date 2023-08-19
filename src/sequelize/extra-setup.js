import { Sequelize } from 'sequelize';

const applyExtraSetup = (sequelize) => {
  if (!(sequelize instanceof Sequelize))
    throw new Error('not a Sequelize instance');

  const { Department, AuthUser, Program } = sequelize.models;

  AuthUser.belongsTo(Department);
  Department.hasMany(AuthUser);
  Program.belongsTo(Department);
  Department.hasMany(Program);
};
export { applyExtraSetup };
