import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import jwt from 'jsonwebtoken';
import { isBlacklisted } from '../helpers/tokenHelpers/jwtHelper.js';
import env from '../env.js';

const config = env();
const accessTokenPrivateKey = config.ACCESS_TOKEN_PRIVATE_KEY;

passport.use(
    'invigilator',
    new BearerStrategy((token, done) => {
        try {
            const decodedToken = jwt.verify(token, accessTokenPrivateKey, {
                ignoreExpiration: true,
            });

            const { id, exp } = decodedToken;

            // Check if the token is in the blacklist
            if (isBlacklisted(id, token)) {
                return done(null, false);
            }

            // Now, you can manually check the token's expiration
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if (exp < currentTimestamp) {
                return done(null, false);
            }

            // Return the user associated with the token
            // Here you may fetch user data from your database and return it
            // const user = { id, isAdmin };
            return done(null, decodedToken);
        } catch (error) {
            // Handle JWT verification errors
            return done(error, false);
        }
    }),
);

// Strategy for administrators
passport.use(
    'staff',
    new BearerStrategy((token, done) => {
        try {
            const decodedToken = jwt.verify(token, accessTokenPrivateKey, {
                ignoreExpiration: true,
            });

            const { role, exp } = decodedToken;

            // Check if the token is in the blacklist
            /* if (isBlacklisted(id, token)) {
                return done(null, false);
            } */

            // Now, you can manually check the token's expiration
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if (exp < currentTimestamp) {
                return done(null, false);
            }

            // Check if the user is an administrator
            if (['admin', 'staff'].includes(role)) {
                // Here you may fetch admin user data from your database and return it
                // const adminUser = { id, isAdmin };
                console.log('authenticated');
                return done(null, decodedToken);
            }

            console.log('Not authenticated!');
            return done(null, false);
        } catch (error) {
            // Handle JWT verification errors
            return done(error, false);
        }
    }),
);

const staffAuthMiddleware = passport.authenticate('staff', { session: false });
const invigilatorAuthMiddleware = passport.authenticate('invigilator', {
    session: false,
});

export { invigilatorAuthMiddleware, staffAuthMiddleware };
