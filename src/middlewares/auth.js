import jwt from 'jsonwebtoken';

const secretKey = process.env.SECRET_KEY;

const authMiddleware = (req, res, next) => {
  const { token } = req.cookies;
  if (!token)
    return res
      .status(401)
      .send('Access denied. You need a valid token to access this route.');

  try {
    const verified = jwt.verify(token, secretKey);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).send('Invalid token.');
  }
  return null;
};

const authAdminMiddleware = (req, res, next) => {
  const { token } = req.cookies;

  if (!token)
    return res
      .status(401)
      .send('Access denied. You need a valid token to access this route.');

  try {
    const verified = jwt.verify(token, secretKey);
    if (!verified.admin)
      return res
        .status(200)
        .send('not authorized admin. Visit staff page instead.');
    req.admin = verified;
    next();
  } catch (error) {
    res.status(400).send('Invalid token.');
  }
  return null;
};

export { authMiddleware, authAdminMiddleware };
