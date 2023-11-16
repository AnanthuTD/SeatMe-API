import jwt from 'jsonwebtoken';
import redisClient from '../../redis/config.js';

const getRefreshTokenFromRedis = async (userId) => {
    try {
        // Retrieve the refresh token from Redis using the user ID
        const refreshToken = await redisClient.get(`refreshToken:${userId}`);
        return refreshToken;
    } catch (error) {
        console.error('Error retrieving refresh token from Redis:', error);
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

        if (!refreshTokenRecord) {
            throw new Error('Invalid refresh token');
        }

        return {
            tokenDetails: decodedToken,
            error: false,
            message: 'Valid refresh token',
        };
    } catch (err) {
        console.error(err);
        return {
            error: true,
            message: 'Invalid refresh token',
        };
    }
};

export default verifyRefreshToken;
