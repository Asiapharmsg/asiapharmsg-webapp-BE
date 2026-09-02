const { default: axios } = require("axios");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET_KEY || "eCom-demo-lezada";
const captchaKey = process.env.CAPTCHA_KEY;


const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    console.log(auth);
    const token = auth !== undefined ? auth.split(" ")[1] : undefined;
    if (!auth || auth.split(" ")[0] !== "Bearer" || token === "") {
      return res
        .status(401)
        .send({ error: "Unauthorized request for this endpoint" });
    }
    const decodedToken = jwt.verify(token, secretKey);
    if (decodedToken != null) {
      req.userId = decodedToken.userId;
      req.username = decodedToken.username;
      req.isAdmin = decodedToken.isAdmin;
      return next();
    } else {
      return res.status(500).send({ error: "Error parsing auth token" });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error parsing auth token" });
  }
};

const verifyCaptcha = async (req, res, next) => {
  const token = req.params.token;
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${captchaKey}&response=${token}`;
  const resp = await axios.post(url);
  if (resp.data.success) {
    console.log("Captcha verified");
    next();
    return;
  } else {
    res.status(500).send({ error: "Error while verifying captcha" });
    return;
  }
};

module.exports = { authenticate, verifyCaptcha };
