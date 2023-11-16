import { models } from '../sequelize/models.js';
import redisClient from './config.js';
import keyNames from './keyNames.js';

const loadRefreshTokensToRedis = async () => {
    try {
        const nonExpiredTokens =
            await models.refreshToken.getNonExpiredTokens();

        await Promise.all(
            nonExpiredTokens.map(async (token) => {
                const currentTime = Math.floor(Date.now() / 1000);
                const expirationTimeUnix = Math.floor(
                    token.expirationTime.getTime() / 1000,
                );
                const remainingTime = Math.max(
                    0,
                    expirationTimeUnix - currentTime,
                );

                await redisClient.set(
                    `${keyNames.refreshToken}:${token.authUserId}`,
                    token.token,
                    'EX',
                    remainingTime,
                );
            }),
        );

        console.log('Refresh tokens loaded into Redis successfully.');
    } catch (error) {
        console.error('Error loading refresh tokens into Redis:', error);
    }
};

const removeRefreshTokenFromRedis = async (authUserId) => {
    try {
        await redisClient.del(`${keyNames.refreshToken}:${authUserId}`);
    } catch (error) {
        console.error('Error removing refresh token from Redis:', error);
    }
};

export default loadRefreshTokensToRedis;
export { removeRefreshTokenFromRedis };
