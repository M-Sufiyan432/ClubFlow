const { assertPermission } = require('../services/permission.service');

const requirePermission = (permission, resolveContext = () => ({})) => async (req, res, next) => {
  try {
    await assertPermission(req.user, permission, await resolveContext(req));
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({
      success: false,
      message: error.message,
      permission
    });
  }
};

module.exports = {
  requirePermission
};
