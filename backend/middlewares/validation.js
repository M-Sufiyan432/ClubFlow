const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Error",errors);
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
    
      
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation rules
exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
];

exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

exports.updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Club validation rules
exports.createClubValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Club name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Club name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['technical', 'cultural', 'sports', 'social', 'academic', 'other','professional'])
    .withMessage('Invalid category'),
  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Visibility must be either public or private')
];

exports.updateClubValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Club name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['technical', 'cultural', 'sports', 'social', 'academic', 'other'])
    .withMessage('Invalid category'),
  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Visibility must be either public or private')
];

// Task validation rules
exports.createTaskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('club')
    .notEmpty().withMessage('Club ID is required')
    .isMongoId().withMessage('Invalid club ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['todo', 'inprogress', 'review', 'completed'])
    .withMessage('Invalid status'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  body('assignedTo')
    .optional()
    .isArray().withMessage('assignedTo must be an array'),
  body('assignedTo.*')
    .isMongoId().withMessage('Invalid user ID in assignedTo'),
  body('assigneeIds')
    .optional()
    .isArray().withMessage('assigneeIds must be an array'),
  body('assigneeIds.*')
    .isMongoId().withMessage('Invalid user ID in assigneeIds'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('attachments')
    .optional()
    .isArray().withMessage('Attachments must be an array'),
  body('dependencies')
    .optional()
    .isArray().withMessage('Dependencies must be an array'),
  body('dependencies.*')
    .isMongoId().withMessage('Invalid task ID in dependencies'),
  body('subtasks')
    .optional()
    .isArray().withMessage('Subtasks must be an array'),
  body('isRecurring')
    .optional()
    .isBoolean().withMessage('isRecurring must be a boolean')
];

exports.updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['todo', 'inprogress', 'review', 'completed'])
    .withMessage('Invalid status'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('attachments')
    .optional()
    .isArray().withMessage('Attachments must be an array'),
  body('dependencies')
    .optional()
    .isArray().withMessage('Dependencies must be an array'),
  body('dependencies.*')
    .isMongoId().withMessage('Invalid task ID in dependencies'),
  body('subtasks')
    .optional()
    .isArray().withMessage('Subtasks must be an array')
];

// Event validation rules
exports.createEventValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('club')
    .notEmpty().withMessage('Club ID is required')
    .isMongoId().withMessage('Invalid club ID'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('eventType')
    .optional()
    .isIn(['meeting', 'workshop', 'social', 'competition', 'deadline', 'other'])
    .withMessage('Invalid event type'),
  body('location.type')
    .optional()
    .isIn(['physical', 'online', 'hybrid'])
    .withMessage('Invalid location type')
];

// Comment validation
exports.addCommentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Comment must be between 1 and 2000 characters')
];

// MongoDB ID validation
exports.mongoIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format')
];

exports.clubIdValidation = [
  param('clubId').isMongoId().withMessage('Invalid club ID format')
];

exports.taskIdValidation = [
  param('taskId').isMongoId().withMessage('Invalid task ID format')
];

exports.eventIdValidation = [
  param('eventId').isMongoId().withMessage('Invalid event ID format')
];

// Pagination validation
exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];
