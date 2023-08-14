/* eslint-disable node/no-unsupported-features/es-syntax */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import applyExtraSetup from './extra-setup.js';

dotenv.config();

const username = process.env.LOCAL_DB_USER_NAME;
const password = process.env.LOCAL_DB_PASSWORD;
const database = process.env.LOCAL_DB_NAME;
const host = process.env.LOCAL_DB_HOST;
const port = process.env.LOCAL_DB_PORT;

const config = {
  host,
  port,
  dialect: 'mysql',
};

const sequelize = new Sequelize(database, username, password, config);

// We execute any extra setup after the models are defined, such as adding associations.
applyExtraSetup(sequelize);

export { sequelize };
