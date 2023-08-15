import { Sequelize } from 'sequelize';

function isSequelizeInstance(object) {
  return object instanceof Sequelize;
}

export { isSequelizeInstance };
