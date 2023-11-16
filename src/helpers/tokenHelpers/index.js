import jwt from 'jsonwebtoken';
import env from '../../env.js';
import { models, sequelize } from '../../sequelize/models.js';

const setNewRefreshToken = async (res, userData) => {
    const config = env();
    const refreshTokenPrivateKey = config.REFRESH_TOKEN_PRIVATE_KEY;

    try {
        const payload = {
            id: userData.id,
            isAdmin: userData.isAdmin,
            email: userData.email,
        };

        const refreshToken = jwt.sign(payload, refreshTokenPrivateKey, {
            expiresIn: '30d',
        });

        await sequelize.transaction(async (t) => {
            await models.refreshToken.destroy({
                where: { authUserId: userData.id },
                transaction: t,
            });

            // Create a new refresh token
            await models.refreshToken.create(
                {
                    authUserId: userData.id,
                    token: refreshToken,
                },
                { transaction: t },
            );
        });

        const currentDate = new Date();
        const expirationDate = new Date(
            currentDate.getTime() + 30 * 24 * 60 * 60 * 1000,
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            expires: expirationDate,
            sameSite: 'strict',
        });
        return true;
    } catch (error) {
        console.error('Error setting new refresh token:', error);
        return false;
    }
};

export { setNewRefreshToken };
