const User = require('../../models/userModel');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Tutor, Counsellor } = require('../../models/employeeModel');


const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email/Username and password are required" });
    }

    // Search by either email or username (both stored lowercase/trimmed)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { userName: email.toLowerCase().trim() }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Blocked check
    if (user.isBlocked && (!user.blockedUntil || new Date() < new Date(user.blockedUntil))) {
      return res.status(403).json({
        message: "Your account is blocked",
        reason: user.blockReason || "Policy violation"
      });
    }

    // Suspended check
    if (
      user.isSuspended &&
      user.suspendedFrom &&
      user.suspendedUntil &&
      new Date() >= new Date(user.suspendedFrom) &&
      new Date() <= new Date(user.suspendedUntil)
    ) {
      return res.status(403).json({
        message: "Your account is suspended",
        reason: user.suspendReason || "Suspicious activity"
      });
    }

    // Password match
    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: user._id,
      role: user.role,
      email: user.email
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
    });

    // Login log
    user.loginHistory.push({
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token cookie
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development", // secure in prod, allows non-HTTPS in dev
  sameSite: "none",                                // ← required for cross-site
  maxAge: 7 * 24 * 60 * 60 * 1000,                  // one week
});


// production for local

    // Send response
    return res.status(200).json({
      message: "Login successful",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    next(err);
  }
};

const adminLoginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email/Username and password are required" });
    }

    // Find by email or username
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { userName: email.toLowerCase().trim() }
      ]
    });

    // Must exist and be an admin
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Blocked check
    if (user.isBlocked && (!user.blockedUntil || new Date() < new Date(user.blockedUntil))) {
      return res.status(403).json({
        message: "Your admin account is blocked",
        reason: user.blockReason || "Policy violation"
      });
    }

    // Suspended check
    if (
      user.isSuspended &&
      user.suspendedFrom &&
      user.suspendedUntil &&
      new Date() >= new Date(user.suspendedFrom) &&
      new Date() <= new Date(user.suspendedUntil)
    ) {
      return res.status(403).json({
        message: "Your admin account is suspended",
        reason: user.suspendReason || "Suspicious activity"
      });
    }

    // Verify password
    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      id: user._id,
      role: user.role,
      email: user.email
    };

    // Sign tokens
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m"
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
    });

    // Log login
    user.loginHistory.push({
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Respond
    return res.status(200).json({
      message: "Admin login successful",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    next(err);
  }
};


const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user payload to request
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};


// ————————————— TUTOR LOGIN —————————————
const tutorLoginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const lookup = email.toLowerCase().trim();
    const tutor = await Tutor.findOne({ email: lookup });
    if (!tutor) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await argon2.verify(tutor.password, password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { id: tutor._id, role: tutor.role, email: tutor.email };
    const { accessToken, refreshToken } = signTokens(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Tutor login successful",
      token: accessToken,
      user: {
        id: tutor._id,
        name: tutor.name,
        email: tutor.email,
        role: tutor.role
      }
    });

  } catch (err) {
    next(err);
  }
};

// ————————————— COUNSELLOR LOGIN —————————————
const counsellorLoginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const lookup = email.toLowerCase().trim();
    const counsellor = await Counsellor.findOne({ email: lookup });
    if (!counsellor) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await argon2.verify(counsellor.password, password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { id: counsellor._id, role: counsellor.role, email: counsellor.email };
    const { accessToken, refreshToken } = signTokens(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Counsellor login successful",
      token: accessToken,
      user: {
        id: counsellor._id,
        name: counsellor.name,
        email: counsellor.email,
        role: counsellor.role
      }
    });

  } catch (err) {
    next(err);
  }
};


module.exports = { loginController, adminLoginController, verifyAccessToken, counsellorLoginController,tutorLoginController };
