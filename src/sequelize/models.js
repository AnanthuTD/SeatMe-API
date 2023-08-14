import department from './models/department.js';

const models = { Department: department };

const sync = () => {
  Object.values(models).forEach((model) => {
    model.sync();
  });
};

export { models, sync };
