// Common helper functions

exports.generateRandomToken = (length = 32) => {
  return require('crypto').randomBytes(length).toString('hex');
};

exports.sanitizeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  return userObj;
};

exports.calculatePagination = (page, limit, total) => {
  return {
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
    total
  };
};

exports.isValidObjectId = (id) => {
  return require('mongoose').Types.ObjectId.isValid(id);
};