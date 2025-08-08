import { checkSchema } from 'express-validator'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { USER_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const loginValidator = checkSchema(
  {
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGE.EMAIL_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const foundUser = await databaseService.users.findOne({
            email: value,
            password: hashPassword(req.body.password)
          })
          if (foundUser === null) throw new Error(USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT)
          // MEMO: Assign value to `user` field in request for using in controller
          req.user = foundUser
          return true
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
    }
  },
  ['body']
)
export const validateUserLogin = validate(loginValidator)

// MEMO: Use schema in `express-validator`
const registerValidator = checkSchema(
  {
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
  },
  ['body']
)
export const validateUserRegistration = validate(registerValidator)

const accessTokenValidator = checkSchema(
  {
    Authorization: {
      notEmpty: {
        errorMessage: USER_MESSAGE.ACCESS_TOKEN_QUIRED
      },
      custom: {
        options: async (val: string, { req }) => {
          const accessToken = val.split(' ')[1] // MEMO: ['Bearer', '123...']
          if (!accessToken) {
            // Return error with 401 status code
            throw new ErrorWithStatus({
              status: HTTP_STATUS.UNAUTHORIZED,
              message: USER_MESSAGE.ACCESS_TOKEN_QUIRED
            })
          }

          const decodedAuthorization = await verifyToken({ token: accessToken })
          req.decodedAuthorization = decodedAuthorization
          return true
        }
      }
    }
  },
  ['headers']
)
export const validateAccessToken = validate(accessTokenValidator)
