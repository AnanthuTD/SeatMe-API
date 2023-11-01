import express from 'express';
import jwt from 'jsonwebtoken';
import { checkCredentialsAndRetrieveData } from '../helpers/commonHelper.js';
import env from '../env.js';
import { models, sequelize } from '../sequelize/models.js';
import verifyRefreshToken from '../helpers/verifyRefreshToken.js';

const router = express.Router();

const config = env();

const accessTokenPrivateKey = config.ACCESS_TOKEN_PRIVATE_KEY;
const refreshTokenPrivateKey = config.REFRESH_TOKEN_PRIVATE_KEY;

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
            const refreshToken = jwt.sign(userData, refreshTokenPrivateKey, {
                expiresIn: '30d',
            });

            try {
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
            } catch (error) {
                console.error(error);
            }

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

            return res.json({ user: userData, accessToken });
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
            designation: tokenDetails.designation,
            isAdmin: tokenDetails.isAdmin,
            name: tokenDetails.name,
        };
        const newAccessToken = jwt.sign(payload, accessTokenPrivateKey, {
            expiresIn: '15m',
        });

        return res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
