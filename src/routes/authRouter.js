import express from 'express';
import jwt from 'jsonwebtoken';
import { checkCredentialsAndRetrieveData } from '../helpers/commonHelper.js';
import env from '../env.js';
import { models } from '../sequelize/models.js';
import verifyRefreshToken from '../helpers/tokenHelpers/verifyRefreshToken.js';
import { setNewRefreshToken } from '../helpers/tokenHelpers/index.js';
import { removeRefreshTokenFromRedis } from '../redis/loadRefreshTokens.js';
import keyNames from '../redis/keyNames.js';

const router = express.Router();

const config = env();

const accessTokenPrivateKey = config.ACCESS_TOKEN_PRIVATE_KEY;

/**
 * @route POST /
 * @desc Authenticate a user based on email and password, and issue a JWT token.
 * @param {string} req.body.email - User's email.
 * @param {string} req.body.password - User's password.
 * @returns {object} Response with a JWT token upon successful authentication, or an error message.
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!(email && password)) {
        return res.status(400).send('Both email and password are required.');
    }

    try {
        const userData = await checkCredentialsAndRetrieveData(email, password);
        if (userData) {
            const accessToken = jwt.sign(userData, accessTokenPrivateKey, {
                expiresIn: '15m',
            });

            if (await setNewRefreshToken(res, userData)) {
                return res.json({ user: userData, accessToken });
            }
            throw new Error('Failed to set a new refresh token');
        }

        // Authentication failed
        return res.status(401).send('Invalid credentials or not Authorized.');
    } catch (error) {
        // Handle errors during authentication
        console.error('error');
        return res.status(500).send('An error occurred during authentication.');
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.cookies;
    console.log(refreshToken);
    if (!refreshToken) return res.sendStatus(403);

    try {
        const { tokenDetails, error, message } = await verifyRefreshToken(
            refreshToken,
        );
        if (error) {
            return res.status(401).json({ error: message });
        }
        const payload = {
            id: tokenDetails.id,
            isAdmin: tokenDetails.isAdmin,
            email: tokenDetails.email,
        };
        await setNewRefreshToken(res, payload);
        const newAccessToken = jwt.sign(payload, accessTokenPrivateKey, {
            expiresIn: '15m',
        });

        return res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/logout', async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.sendStatus(200);
    const privateKey = process.env.REFRESH_TOKEN_PRIVATE_KEY;

    try {
        const decodedToken = jwt.verify(refreshToken, privateKey);

        models.refreshToken.destroy({ where: { authUserId: decodedToken.id } });

        removeRefreshTokenFromRedis(decodedToken.id);

        res.clearCookie(keyNames.refreshToken);

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
