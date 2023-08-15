import { sequelize } from './db.js';
import department from './models/department.js';
import applyExtraSetup from './extra-setup.js';
import authUser from './models/auth_user.js';

const models = {
  Department: department(sequelize),
  AuthUser: authUser(sequelize),
};
// We execute any extra setup after the models are defined, such as adding associations.
applyExtraSetup(sequelize);

const sync = () => {
  sequelize.sync();
};

export { models, sync };
