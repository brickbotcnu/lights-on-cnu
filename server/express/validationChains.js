import { body, validationResult } from 'express-validator';

export const userFieldValidation = (fieldName) => body(fieldName)
                                    .trim()
                                    .notEmpty()
                                    .isAlphanumeric('en-US')
                                    .isLength({min: 6, max: 31});

export const passFieldValidation = (fieldName) => body(fieldName)
                                    .trim()
                                    .notEmpty()
                                    .isAscii()
                                    .isLength({min: 6, max: 63});

export function fieldHasValidationErrors(req, name) {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return validationErrors.array().filter(err => err.path == name).length > 0;
    } else return false;
}
