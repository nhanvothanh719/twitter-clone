import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'

export const validateUserLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({
      error: 'Missing email or password'
    })
  next()
}

// MEMO: Use schema in `express-validator`
const registerValidator = checkSchema({
  name: {
    notEmpty: true,
    isLength: {
      options: {
        min: 2,
        max: 50
      }
    },
    trim: true
  },
  email: {
    notEmpty: true,
    isEmail: true,
    trim: true
  },
  password: {
    notEmpty: true,
    isString: true,
    isLength: {
      options: {
        min: 8,
        max: 50
      }
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 0,
        minSymbols: 0
      }
    }
  },
  confirm_password: {
    notEmpty: true,
    isString: true,
    isLength: {
      options: {
        min: 8,
        max: 50
      }
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 0,
        minSymbols: 0
      }
    },
    custom: {
      options: (value, { req }) => {
        if (value === req.body.password) return true
        throw new Error('Password confirmation does not match password')
      }
    }
  },
  date_of_birth: {
    isISO8601: {
      options: {
        strict: true,
        strictSeparator: true
      }
    }
  }
})
export const validateUserRegistration = validate(registerValidator)
