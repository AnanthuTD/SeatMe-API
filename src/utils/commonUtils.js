import { models } from '../sequelize/models.js';

/**
 * Check user credentials and retrieve user data for an admin user.
 * @param {string} email - User's email for authentication.
 * @param {string} password - User's password for authentication.
 * @returns {object|null} User data object if credentials are valid and user is an admin, or null if not.
 */
async function checkCredentialsAndRetrieveData(email, password) {
    try {
        // Find a user in the database with matching email, password, and is_admin = true
        const user = await models.authUser.findOne({
            where: {
                email,
                password,
            },
            attributes: ['id', 'name', 'designation', 'is_admin'],
        });

        if (user) {
            // Credentials match and user is an admin
            const userData = user.get();
            // Here, you can retrieve additional data or perform actions with userData
            return userData;
        }

        // Credentials are incorrect or user is not an admin
        return null;
    } catch (error) {
        console.error('Error:', error);
        return null; // Handle database errors or exceptions
    }
}

export { checkCredentialsAndRetrieveData };
