import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { checkCredentialsAndRetrieveData } from '../helpers/commonHelper.js';
import env from '../env.js';
import { models } from '../sequelize/models.js';
import verifyRefreshToken from '../helpers/tokenHelpers/verifyRefreshToken.js';
import { setNewRefreshToken } from '../helpers/tokenHelpers/index.js';
import { removeRefreshTokenFromRedis } from '../redis/loadRefreshTokens.js';
import keyNames from '../redis/keyNames.js';
import logger from '../helpers/logger.js';

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
    logger.debug(req.body);
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
        logger.error(error, 'error');
        return res.status(500).send('An error occurred during authentication.');
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.cookies;
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
        logger.error(error);
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
        logger.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/signin', async (req, res) => {
    const { credential } = req.body;
    const idToken = credential;

    const { CLIENT_ID } = process.env;

    const client = new OAuth2Client(CLIENT_ID);

    try {
        // Verify the ID token using the OAuth2Client
        const ticket = await client.verifyIdToken({
            idToken,
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const userEmail = payload.email;

        // Check if the user's email exists in the auth_user table
        const existingUser = await models.authUser.findOne({
            where: { email: userEmail },
            attributes: [
                'id',
                'name',
                'designation',
                'isAdmin',
                'email',
                'phone',
            ],
        });

        const userData = existingUser.get();

        if (userData) {
            // User exists in the database

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
            return res
                .status(401)
                .send('Invalid credentials or not Authorized.');
        }
        res.status(400).json({ message: 'Signin Failed' });
    } catch (error) {
        console.error('Error verifying token:', error);
        // Handle the error (e.g., return an error response)
        res.status(400).json({ error: 'Invalid token' });
    }
});

export default router;
