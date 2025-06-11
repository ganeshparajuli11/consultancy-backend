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


const checkIsAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access only" });
  }
  next();
};

module.exports = {
  checkIsUser,
  checkIsTutor,
  checkIsAdmin,
  checkIsCounseller
};
