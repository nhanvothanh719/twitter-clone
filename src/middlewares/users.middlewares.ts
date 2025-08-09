import { Request } from 'express'
import { checkSchema } from 'express-validator'
import jwt from 'jsonwebtoken'
import _ from 'lodash'
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
      trim: true,
      custom: {
        options: async (val: string, { req }) => {
          const accessToken = (val || '').split(' ')[1] // MEMO: ['Bearer', '123...']
          if (!accessToken) {
            // Return error with 401 status code
            throw new ErrorWithStatus({
              status: HTTP_STATUS.UNAUTHORIZED,
              message: USER_MESSAGE.ACCESS_TOKEN_REQUIRED
            })
          }

          try {
            const decodedAuthorization = await verifyToken({
              token: accessToken,
              privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
            })
            ;(req as Request).decoded_authorization = decodedAuthorization
          } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED,
                message: _.capitalize(error.message)
              })
            }
            throw error
          }
          return true
        }
      }
    }
  },
  ['headers']
)
export const validateAccessToken = validate(accessTokenValidator)

const refreshTokenValidator = checkSchema(
  {
    refresh_token: {
      trim: true,
      custom: {
        options: async (val: string, { req }) => {
          try {
            if (!val) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED,
                message: USER_MESSAGE.REFRESH_TOKEN_REQUIRED
              })
            }
            const [decodedRefreshToken, foundRefreshToken] = await Promise.all([
              verifyToken({ token: val, privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
              databaseService.refreshTokens.findOne({
                token: val
              })
            ])
            if (foundRefreshToken === null) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED,
                message: USER_MESSAGE.REFRESH_TOKEN_NOT_EXIST
              })
            }
            ;(req as Request).decoded_refresh_token = decodedRefreshToken
          } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED,
                message: _.capitalize(error.message)
              })
            }
            throw error
          }
          return true
        }
      }
    }
  },
  ['body']
)
export const validateRefreshToken = validate(refreshTokenValidator)

const emailVerifyTokenValidator = checkSchema(
  {
    email_verify_token: {
      trim: true,
      custom: {
        options: async (val: string, { req }) => {
          if (!val) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.UNAUTHORIZED,
              message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_REQUIRED
            })
          }

          try {
            const decodedEmailVerifyToken = await verifyToken({
              token: val,
              privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
            })
            ;(req as Request).decoded_email_verify_token = decodedEmailVerifyToken
          } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED,
                message: _.capitalize(error.message)
              })
            }
            throw error
          }

          return true
        }
      }
    }
  },
  ['body']
)
export const validateEmailVerifyToken = validate(emailVerifyTokenValidator)
