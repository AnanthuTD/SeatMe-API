import { sequelize } from './connection.js';
import Department from './models/department.js';
import { applyExtraSetup } from './extra-setup.js';
import AuthUser from './models/auth_user.js';

const models = {
  Department: Department(sequelize),
  AuthUser: AuthUser(sequelize),
};

applyExtraSetup(sequelize);

export { models, sequelize };
