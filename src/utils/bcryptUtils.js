// controllers/authController.js
import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';
import { Op } from 'sequelize';
import { models } from '../sequelize/models.js';

/**
 * Check if a user with the provided email or ID already exists.
 * @param {string} email - The email address to check.
 * @param {number} id - The ID to check.
 * @returns {Promise<boolean>} A Promise that resolves to true if the user exists, or false if not.
 */
const doesUserExist = async (email, id) => {
    const user = await models.AuthUser.findOne({
        where: { [Op.or]: [{ email }, { id }] },
    });
    return user !== null;
};

/**
 * Insert a new user into the database.
 * @param {object} staffData - The user data to insert.
 * @returns {Promise<object>} A Promise that resolves to the created user object.
 */
const insertUser = async (staffData) => {
    const user = await models.AuthUser.create(staffData);
    return user;
};

/**
 * Check the strength of a password using the zxcvbn library.
 * @param {string} password - The password to check.
 * @returns {boolean} True if the password is strong enough, false otherwise.
 */
const checkPasswordStrength = (password) => {
    const result = zxcvbn(password);
    return result.score >= 3; // Require a score of 3 or higher (adjust based on your requirements)
};

/**
 * Create a new staff user.
 * @param {object} staffData - The user data for the new staff member.
 * @returns {Promise<object>} A Promise that resolves to an object containing status and message.
 */
const createStaff = async (staffData) => {
    console.log(staffData);
    try {
        if (await doesUserExist(staffData.email, staffData.id)) {
            return { status: 409, message: 'Id or Email already exists' };
        }

        checkPasswordStrength(staffData.password);

        staffData.password = await bcrypt.hash(staffData.password, 12);

        await insertUser(staffData);

        return { status: 201, message: 'User registered successfully' };
    } catch (error) {
        console.error(error);
        return {
            status: 500,
            message: 'An error occurred during registration',
        };
    }
};

export { createStaff, doesUserExist, insertUser };
