const mongoose = require('mongoose');

// You must pass the model and field to compare (e.g., 'owner' or 'createdBy')
const checkResourceOwnership = (Model, ownerField = 'owner') => {
  return async (req, res, next) => {
    try {
      const { id } = req.params; // assumes :id in URL
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }

      const resource = await Model.findById(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (resource[ownerField].toString() !== req.user.id) {
        return res.status(403).json({ message: "You do not own this resource" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = checkResourceOwnership;
