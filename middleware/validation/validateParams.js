const { ZodError } = require('zod');

const validateParams = (schema, source = 'params') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Parameter validation error",
        errors: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(err);
  }
};

module.exports = validateParams;
