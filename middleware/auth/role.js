const checkIsUser = (req, res, next) => {
  if (req.user?.role !== "student") {
    return res.status(403).json({ message: "Forbidden: Student access only" });
  }
  next();
};

const checkIsTutor = (req, res, next) => {
  if (req.user?.role !== "tutor") {
    return res.status(403).json({ message: "Forbidden: Tutor access only" });
  }
  next();
};

const checkIsCounseller = (req, res, next) => {
  if (req.user?.role !== "counseller") {
    return res.status(403).json({ message: "Forbidden: Tutor access only" });
  }
  next();
};


function checkIsAdmin(req, res, next) {
  // DEV BYPASS: allow everyone through when developing locally
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // your real admin-only logic comes next
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }

  next();
}

module.exports = {
  checkIsUser,
  checkIsTutor,
  checkIsAdmin,
  checkIsCounseller
};
