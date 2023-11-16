import jwt from 'jsonwebtoken';
import env from '../../env.js';
import { models } from '../../sequelize/models.js';
import redisClient from '../../redis/config.js';

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

        const expiryInSec = 30 * 24 * 60 * 60;

        const currentDate = new Date();
        const expirationDate = new Date(
            currentDate.getTime() + expiryInSec * 1000,
        );

        await models.refreshToken.upsert(
            {
                authUserId: userData.id,
                token: refreshToken,
                expirationTime: expirationDate,
            },
            { where: { authUserId: userData.id } },
        );

        await redisClient.set(
            `refreshToken:${userData.id}`,
            refreshToken,
            'EX',
            expiryInSec,
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
