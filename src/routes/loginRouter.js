import express from 'express';
import jwt from 'jsonwebtoken';
import { checkCredentialsAndRetrieveData } from '../helpers/commonHelper.js';

const router = express.Router();

// Secret key used for JWT token generation and verification
const secretKey = process.env.SECRET_KEY;

/**
 * @route POST /
 * @desc Authenticate a user based on email and password, and issue a JWT token.
 * @param {string} req.body.email - User's email.
 * @param {string} req.body.password - User's password.
 * @returns {object} Response with a JWT token upon successful authentication, or an error message.
 */
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    // Check if both email and password are provided
    if (!(email && password)) {
        return res.status(400).send('Both email and password are required.');
    }

    try {
        // Authenticate user credentials and retrieve user data
        const userData = await checkCredentialsAndRetrieveData(email, password);

        if (userData) {
            // Generate a JWT token
            const token = jwt.sign(userData, secretKey, {
                expiresIn: '1h', // Token expires in 1 hour
            });

            // Log the decoded token (for demonstration purposes)
            console.log(jwt.verify(token, secretKey));

            // Calculate token expiration date (1 hour from now)
            const expirationDate = new Date(Date.now() + 3600000);

            // Set JWT token as a cookie in the response
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                expires: expirationDate,
                sameSite: 'strict',
            });

            // Respond with the generated token
            return res.send(userData);
        }

        // Authentication failed
        return res.status(401).send('Invalid credentials or not Authorized.');
    } catch (error) {
        // Handle errors during authentication
        return res.status(500).send('An error occurred during authentication.');
    }
});

export default router;
