import path from 'path';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import getRootDir from '../../getRootDir.js';

// Specify the path to your .env file
const envFilePath = path.resolve(getRootDir(), '.env');

// Load environment variables from the specified file
dotenv.config({ path: envFilePath });

const username = process.env.DB_USER_NAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;

const config = {
    host,
    port,
    dialect: 'mysql',
    dialectOptions: {
        connectTimeout: 30000,
    },
    // logging: false,
};

const sequelize = new Sequelize(database, username, password, config);

export { sequelize };
