import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { USER_MESSAGE } from '~/constants/messages'
import usersService from '~/services/users.services'
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
    notEmpty: {
      errorMessage: USER_MESSAGE.NAME_REQUIRED
    },
    isString: {
      errorMessage: USER_MESSAGE.NAME_STRING
    },
    isLength: {
      options: {
        min: 2,
        max: 50
      },
      errorMessage: USER_MESSAGE.NAME_LENGTH
    },
    trim: true
  },
  email: {
    notEmpty: {
      errorMessage: USER_MESSAGE.EMAIL_REQUIRED
    },
    isEmail: {
      errorMessage: USER_MESSAGE.EMAIL_INVALID
    },
    trim: true,
    custom: {
      options: async (value) => {
        const isUniqueEmail = await usersService.isUniqueEmail(value)
        if (isUniqueEmail) return true
        throw new Error(USER_MESSAGE.EMAIL_ALREADY_EXISTS)
      }
    }
  },
  password: {
    notEmpty: {
      errorMessage: USER_MESSAGE.PASSWORD_REQUIRED
    },
    isString: {
      errorMessage: USER_MESSAGE.PASSWORD_STRING
    },
    isLength: {
      options: {
        min: 8,
        max: 50
      },
      errorMessage: USER_MESSAGE.PASSWORD_LENGTH
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 0,
        minSymbols: 0
      },
      errorMessage: USER_MESSAGE.PASSWORD_WEAK
    }
  },
  confirm_password: {
    notEmpty: {
      errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_REQUIRED
    },
    isString: {
      errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_STRING
    },
    custom: {
      options: (value, { req }) => {
        if (value === req.body.password) return true
        throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH)
      }
    }
  },
  date_of_birth: {
    isISO8601: {
      options: {
        strict: true,
        strictSeparator: true
      },
      errorMessage: USER_MESSAGE.DATE_OF_BIRTH_INVALID
    }
  }
})
export const validateUserRegistration = validate(registerValidator)
