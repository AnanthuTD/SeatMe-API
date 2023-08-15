import { sequelize } from './db.js';
import department from './models/department.js';

const models = { Department: department(sequelize) };

const sync = () => {
  Object.values(models).forEach((model) => {
    model.sync();
  });
};

export { models, sync };
