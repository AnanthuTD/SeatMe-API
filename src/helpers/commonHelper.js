import { models } from '../sequelize/models.js';
import { comparePasswords } from './bcryptHelper.js';

/**
 * Check user credentials and retrieve user data for authorized user.
 * @param {string} email - User's email for authentication.
 * @param {string} password - User's password for authentication.
 * @returns {object|null} User data object if credentials are valid and user is authorized, or null if not.
 */
async function checkCredentialsAndRetrieveData(email, password) {
    if (!email || !password) return null;
    try {
        // Find a user in the database with matching email, password, and is_admin = true
        const user = await models.authUser.findOne({
            where: {
                email,
            },
            attributes: ['id', 'name', 'designation', 'isAdmin', 'password'],
        });

        if (user) {
            // Credentials match and user is authorized
            const userData = user.get();
            const storedHashedPassword = userData.password;
            if (await comparePasswords(password, storedHashedPassword)) {
                delete userData.password;
                return userData;
            }
        }

        // Credentials are incorrect or user is not authorized
        return null;
    } catch (error) {
        console.error('Error:', error);
        return null; // Handle database errors or exceptions
    }
}

export { checkCredentialsAndRetrieveData };
