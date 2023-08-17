import jwt from 'jsonwebtoken';

const secretKey = 'yourSecretKeyHere';

const authMiddleware = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).send('Access denied.');

  try {
    const verified = jwt.verify(token, secretKey);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).send('Invalid token.');
  }
};

const authAdminMiddleware = (req, res, next) => {
  authAdminMiddleware(req, res, next);
  if (req.user.admin) next();
  res.status(200).send('not authorized admin. Visit staff page instead.');
};

export { authMiddleware, authAdminMiddleware };
