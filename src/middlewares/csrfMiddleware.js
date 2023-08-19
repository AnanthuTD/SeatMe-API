import { randomBytes } from 'node:crypto';

/**
 * Generate a CSRF token and store it in the user's session.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const generateCsrfToken = (req, res) => {
  const csrf = randomBytes(32).toString('hex');
  req.session['X-CSRFToken'] = csrf;
  res.send({ 'X-CSRFToken': csrf });
};

// List of HTTP methods that require CSRF protection
const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Middleware for CSRF protection.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next function in the middleware chain.
 * @returns {object|null} If CSRF token validation fails, an error response is sent. Otherwise, the next middleware is invoked.
 */
const csrfProtectionMiddleware = (req, res, next) => {
  if (protectedMethods.includes(req.method)) {
    const clientToken = req.headers['x-csrftoken'];
    const sessionToken = req.session['X-CSRFToken'];

    console.log(clientToken, sessionToken, req.headers);

    if (!clientToken || clientToken !== sessionToken) {
      return res.status(403).send('CSRF token validation failed.');
    }
  }
  return next();
};

export { csrfProtectionMiddleware, generateCsrfToken };
