import { sequelize } from './models.js';

sequelize.sync({ alter: true });
