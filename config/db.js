import Sequelize from 'sequelize';
import configJson from './config.js';

const env = process.env.NODE_ENV || 'development';

const { database, username, password, ...config } = configJson[env];

const sequelize = new Sequelize(database, username, password, config);

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export default sequelize;
