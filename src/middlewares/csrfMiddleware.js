const { randomBytes } = await import('node:crypto');

const generateCsrfToken = (req, res) => {
  const csrf = randomBytes(32).toString('hex');
  req.session['X-CSRFToken'] = csrf;
  res.send({ 'X-CSRFToken': csrf });
};

const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

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
