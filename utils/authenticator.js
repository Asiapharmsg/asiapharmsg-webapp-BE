const { default: axios } = require('axios');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;
const captchaKey = process.env.CAPTCHA_KEY;

// Requires a valid `Authorization: Bearer <jwt>` header. Sets req.userId,
// req.username and req.isAdmin for downstream handlers.
const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    const token = auth !== undefined ? auth.split(' ')[1] : undefined;
    if (!auth || auth.split(' ')[0] !== 'Bearer' || !token) {
      return res
        .status(401)
        .send({ error: 'Unauthorized request for this endpoint' });
    }
    const decodedToken = jwt.verify(token, secretKey);
    req.userId = decodedToken.userId;
    req.username = decodedToken.username;
    req.isAdmin = decodedToken.isAdmin === true;
    return next();
  } catch (err) {
    return res.status(401).send({ error: 'Invalid or expired token' });
  }
};

// Must run after authenticate.
const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).send({ error: 'Admin access required' });
  }
  return next();
};

// Allows the request when the route param names the caller's own id, or the
// caller is an admin. Must run after authenticate.
const selfOrAdmin = (param) => (req, res, next) => {
  if (req.isAdmin || String(req.params[param]) === String(req.userId)) {
    return next();
  }
  return res.status(403).send({ error: 'Not allowed for this account' });
};

const verifyCaptcha = async (req, res, next) => {
  const token = req.params.token;
  if (!token) {
    return res.status(400).send({ error: 'Captcha token missing' });
  }
  try {
    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const resp = await axios.post(url, null, {
      params: { secret: captchaKey, response: token },
      timeout: 10000
    });
    if (resp.data && resp.data.success) {
      return next();
    }
    return res.status(400).send({ error: 'Captcha verification failed' });
  } catch (err) {
    console.error('Captcha verification request failed:', err.message);
    return res
      .status(502)
      .send({ error: 'Captcha verification unavailable, please retry' });
  }
};

module.exports = { authenticate, requireAdmin, selfOrAdmin, verifyCaptcha };
