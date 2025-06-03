import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './error.middleware.js';
export const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Log the validation errors for debugging
        console.error("🚨 Validation Errors:", errors.array());

        const extractedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));

        return next(new AppError('Validation failed', 400, extractedErrors));
    };
};

// Common validation chains
export const commonValidations = {
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ],
    
    objectId: (field) => 
        param(field)
            .isMongoId()
            .withMessage(`Invalid ${field} ID format`),

    email: 
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email'),

    password: 
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
            .withMessage('Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character'),

    name:
        body('name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),

    price:
        body('price')
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),

    url:
        body('url')
            .isURL()
            .withMessage('Please provide a valid URL')
};

// User validation chains
export const validateSignup = validate([
    commonValidations.name,
    commonValidations.email,
    commonValidations.password
]);

export const validateSignin = validate([
    commonValidations.email,
    body('password')
        .notEmpty()
        .withMessage('Password is required')
]);

export const validatePasswordChange = validate([
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        })
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character')
]);

export const validateDescription = validate([
    body('description')
        .isObject()
        .withMessage('Description must be an object')
        .custom((value) => {
            if (!value.abstract || !value.problemStatement || !value.proposedMethodology) {
                throw new Error("Abstract, problemStatement, and proposedMethodology are required fields");
            }
            return true;
        }),
    body('description.abstract')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Abstract is required'),
    body('description.problemStatement')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Problem statement is required'),
    body('description.proposedMethodology')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Proposed methodology is required'),
]);
