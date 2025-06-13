const User = require('../../models/userModel');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

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
      expiresIn: process.env.JWT_EXPIRES_IN || "15m"
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
      secure: process.env.NODE_ENV !== "development",  
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
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

module.exports = { loginController, adminLoginController, verifyAccessToken };
