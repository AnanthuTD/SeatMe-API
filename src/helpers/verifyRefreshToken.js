import jwt from 'jsonwebtoken';
import { models } from '../sequelize/models.js';

const verifyRefreshToken = async (refreshToken) => {
    const privateKey = process.env.REFRESH_TOKEN_PRIVATE_KEY;

    try {
        const newAccessToken = jwt.verify(refreshToken, privateKey);

        const refreshTokenRecord = await models.refreshToken.findOne({
            where: { token: refreshToken },
        });

        if (!refreshTokenRecord) {
            throw new Error('Invalid refresh token');
        }

        return {
            tokenDetails: newAccessToken,
            error: false,
            message: 'Valid refresh token',
        };
    } catch (err) {
        return {
            error: true,
            message: 'Invalid refresh token',
        };
    }
};

export default verifyRefreshToken;
