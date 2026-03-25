const {validationResult,body} = require('express-validator')

const isValidationMessage = (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
        return next(); // no errors, continue to next middleware
    }
    return res.status(400).json({ errors: result.array() });
};

const registerUserValidator = [
    body('email')
        .isEmail()
        .withMessage('Invalid email'),
    body('username')
        .isString()
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 characters"),
    body('password')
        .isStrongPassword()
        .withMessage("Password must be strong and at least 6 characters"),
    body("phone")
    .isMobilePhone()
    .withMessage("invalid phone number"),
];

const loginValidation = [
  body("phone")
    .isMobilePhone()
    .withMessage("invalid phone number"),
  body("password").notEmpty().withMessage("Password is required"),
  isValidationMessage,
];


module.exports = {registerUserValidator,loginValidation}

