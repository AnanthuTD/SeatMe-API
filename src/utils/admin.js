import { models } from '../sequelize/models.js';

async function checkCredentialsAndRetrieveData(email, password) {
  try {
    const user = await models.AuthUser.findOne({
      where: {
        email,
        password,
        is_admin: true,
      },
      attributes: ['id', 'name', 'designation'],
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
    return null;
  }
}

export { checkCredentialsAndRetrieveData };
