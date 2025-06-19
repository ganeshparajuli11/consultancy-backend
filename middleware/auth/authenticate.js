const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  // DEV BYPASS: don’t require a token when running locally
  if (process.env.NODE_ENV === "development") {
    // mock user for testing
    req.user = { id: "000000000000000000000000" };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = authenticateJWT;
