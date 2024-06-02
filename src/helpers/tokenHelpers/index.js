import jwt from 'jsonwebtoken';
import env from '../../env.js';
import { models } from '../../sequelize/models.js';
import redisClient from '../../redis/config.js';
import keyNames from '../../redis/keyNames.js';
import logger from '../logger.js';

const setNewRefreshToken = async (res, userData) => {
    const config = env();
    const refreshTokenPrivateKey = config.REFRESH_TOKEN_PRIVATE_KEY;

    try {
        const payload = {
            id: userData.id,
            role: userData.role,
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
            `${keyNames.refreshToken}:${userData.id}`,
            refreshToken,
            'EX',
            expiryInSec,
        );

        res.cookie(`${keyNames.refreshToken}`, refreshToken, {
            httpOnly: true,
            secure: true,
            expires: expirationDate,
            sameSite: 'strict',
        });
        return true;
    } catch (error) {
        logger.error(error, 'Error setting new refresh token:');
        return false;
    }
};

export { setNewRefreshToken };
