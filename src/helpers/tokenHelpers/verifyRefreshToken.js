import jwt from 'jsonwebtoken';
import redisClient from '../../redis/config.js';
import keyNames from '../../redis/keyNames.js';
import logger from '../logger.js';

const getRefreshTokenFromRedis = async (userId) => {
    try {
        // Retrieve the refresh token from Redis using the user ID
        const refreshToken = await redisClient.get(
            `${keyNames.refreshToken}:${userId}`,
        );
        logger.trace('refresh token from redis: ', refreshToken);
        return refreshToken;
    } catch (error) {
        logger.error(error, 'Error retrieving refresh token from Redis:');
        throw error; // Handle the error appropriately in your application
    }
};

const verifyRefreshToken = async (refreshToken) => {
    const privateKey = process.env.REFRESH_TOKEN_PRIVATE_KEY;

    try {
        const decodedToken = jwt.verify(refreshToken, privateKey);

        const refreshTokenRecord = await getRefreshTokenFromRedis(
            decodedToken.id,
        );

        if (!refreshTokenRecord || refreshTokenRecord !== refreshToken) {
            // TODO Re-enable this refresh token verification before production deployment
            throw new Error('Invalid refresh token');
        }

        return {
            tokenDetails: decodedToken,
            error: false,
            message: 'Valid refresh token',
        };
    } catch (err) {
        logger.error(err);
        return {
            error: true,
            message: 'Invalid refresh token',
        };
    }
};

export default verifyRefreshToken;
