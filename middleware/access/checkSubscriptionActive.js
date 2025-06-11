const checkSubscriptionActive = (req, res, next) => {
  const sub = req.user.subscription;

  if (
    !sub ||
    sub.status !== "active" ||
    (sub.expiresAt && new Date(sub.expiresAt) < Date.now())
  ) {
    return res.status(402).json({
      message: "Subscription expired or inactive. Please renew to continue."
    });
  }

  next();
};

module.exports = checkSubscriptionActive;
