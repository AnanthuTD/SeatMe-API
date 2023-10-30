import jwt from 'jsonwebtoken';
import { isBlacklisted } from '../helpers/jwtHelper.js';

// Retrieve the secret key from environment variables
const secretKey = process.env.SECRET_KEY;

/**
 * Middleware for authenticating staff users.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next function in the middleware chain.
 * @returns {object|null} If authentication fails, an error response is sent. Otherwise, the next middleware is invoked.
 */
const authStaffMiddleware = (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res
            .status(401)
            .send(
                'Access denied. You need a valid token to access this route.',
            );
    }

    try {
        const verified = jwt.verify(token, secretKey);

        // checking if the token is in the blacklist
        if (isBlacklisted(verified.id, token))
            return res
                .status(403)
                .send('Access denied. This token has been blacklisted.');

        req.user = verified;
        return next();
    } catch (error) {
        return res.status(400).send('Invalid token.');
    }
};

/**
 * Middleware for authenticating admin users.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next function in the middleware chain.
 * @returns {object|null} If authentication fails, an error response is sent. Otherwise, the next middleware is invoked.
 */
const authAdminMiddleware = (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res
            .status(401)
            .send(
                'Access denied. You need a valid token to access this route.',
            );
    }

    try {
        const verified = jwt.verify(token, secretKey);
        // checking if the token is in the blacklist
        if (isBlacklisted(verified.id, token))
            return res
                .status(403)
                .send('Access denied. This token has been blacklisted.');

        if (!verified.isAdmin) {
            return res
                .status(403)
                .send('Access denied. You are not authorized as an admin.');
        }
        req.admin = verified;
        return next();
    } catch (error) {
        return res.status(400).send('Invalid token.');
    }
};

export { authStaffMiddleware, authAdminMiddleware };
