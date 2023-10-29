import { Sequelize } from 'sequelize';

/**
 * Check if an object is an instance of the Sequelize class.
 *
 * @param {object} object - The object to check.
 * @returns {boolean} True if the object is an instance of Sequelize, otherwise false.
 */
function isSequelizeInstance(object) {
    return object instanceof Sequelize;
}

export { isSequelizeInstance };
