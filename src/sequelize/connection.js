import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const username = process.env.DB_USER_NAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;

const config = {
    host,
    port,
    dialect: 'mysql',
};

const sequelize = new Sequelize(database, username, password, config);

export { sequelize };
