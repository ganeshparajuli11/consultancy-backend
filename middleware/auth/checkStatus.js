const checkStatus = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized: No user found in request" });
  }

  // Blocked check
  if (user.isBlocked && (!user.blockedUntil || new Date() < new Date(user.blockedUntil))) {
    return res.status(403).json({
      message: "Access denied: Your account is blocked",
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
      message: "Access denied: Your account is suspended",
      reason: user.suspendReason || "Suspicious activity"
    });
  }

  next();
};

const checkAllStatus = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized: No user found in request" });
  }

  // Reuse checkStatus logic
  if (user.isBlocked && (!user.blockedUntil || new Date() < new Date(user.blockedUntil))) {
    return res.status(403).json({
      message: "Access denied: Your account is blocked",
      reason: user.blockReason || "Policy violation"
    });
  }

  if (
    user.isSuspended &&
    user.suspendedFrom &&
    user.suspendedUntil &&
    new Date() >= new Date(user.suspendedFrom) &&
    new Date() <= new Date(user.suspendedUntil)
  ) {
    return res.status(403).json({
      message: "Access denied: Your account is suspended",
      reason: user.suspendReason || "Suspicious activity"
    });
  }

  // Subscription check
  if (
    user.subscription &&
    user.subscription.status !== "active"
  ) {
    return res.status(402).json({
      message: "Payment required: Your subscription is not active",
      status: user.subscription.status
    });
  }

  next();
};

module.exports = {
  checkStatus,
  checkAllStatus,
};
