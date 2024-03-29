// controllers/authController.js
import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';
import { Op } from 'sequelize';
import { models } from '../sequelize/models.js';
import logger from './logger.js';

/**
 * Check if a user with the provided email or ID already exists.
 * @param {string} email - The email address to check.
 * @param {number} id - The ID to check.
 * @returns {Promise<boolean>} A Promise that resolves to true if the user exists, or false if not.
 */
const doesUserExist = async (email, id) => {
    const user = await models.authUser.findOne({
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
    const user = await models.authUser.create(staffData);
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

const encrypt = (value) => {
    return bcrypt.hash(value, 12);
};

/**
 * Create a new staff user.
 * @param {object} staffData - The user data for the new staff member.
 * @returns {Promise<object>} A Promise that resolves to an object containing status and message.
 */
const createStaff = async (staffDataArray) => {
    try {
        const uncreatedStaffs = [];

        await Promise.all(
            staffDataArray.map(async (staffData) => {
                if (!staffData.password) {
                    uncreatedStaffs.push({
                        ...staffData,
                        error: 'Password is required',
                    });
                    return;
                }

                staffData.password = await encrypt(staffData.password);

                try {
                    await models.authUser.upsert(staffData, {
                        where: { id: staffData.id },
                    });
                } catch (error) {
                    logger.error(error);
                    uncreatedStaffs.push({
                        ...staffData,
                        error:
                            error.message ||
                            'Error occurred during upsert operation',
                    });
                }
            }),
        );

        if (uncreatedStaffs.length > 0) {
            return {
                status: 409,
                message:
                    'Some users were not registered or updated successfully',
                uncreatedStaffs,
            };
        }
        return {
            status: 200,
            message: 'Users registered or updated successfully',
        };
    } catch (error) {
        logger.error(error);
        return {
            status: 500,
            message:
                'An unexpected error occurred during registration or update',
        };
    }
};

const updatePassword = async (staffId, newPassword) => {
    try {
        if (!staffId || !newPassword)
            return { status: 400, message: 'Missing parameters!' };

        newPassword = await encrypt(newPassword);

        // Correct the syntax of the update method
        const [updateCount] = await models.authUser.update(
            { password: newPassword },
            { where: { id: staffId } },
        );

        if (updateCount > 0) {
            return { status: 200, message: 'Password updated successfully' };
        }

        return { status: 400, message: 'Staff not found' };
    } catch (error) {
        logger.error(error);
        return {
            status: 500,
            message: 'An error occurred during updating password!',
        };
    }
};

const createAdmin = async (adminData) => {
    logger.trace(adminData);
    try {
        if (await doesUserExist(adminData.email, adminData.id)) {
            return { status: 409, message: 'Id or Email already exists' };
        }

        // checkPasswordStrength(adminData.password);

        adminData.password = await encrypt(adminData.password);

        await insertUser(adminData);

        return { status: 201, message: 'User registered successfully' };
    } catch (error) {
        logger.error(error);
        return {
            status: 500,
            message: 'An error occurred during registration',
        };
    }
};

const comparePasswords = (password, storedHashedPassword) => {
    return bcrypt.compare(password, storedHashedPassword);
};

export {
    createStaff,
    doesUserExist,
    insertUser,
    createAdmin,
    encrypt,
    comparePasswords,
    updatePassword,
};
