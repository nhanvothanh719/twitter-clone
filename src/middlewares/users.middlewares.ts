import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import jwt from 'jsonwebtoken'
import _ from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { USER_MESSAGE } from '~/constants/messages'
import { USERNAME_REGEX } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
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

const confirmPasswordSchema: ParamSchema = {
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
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (val: string, { req }) => {
      try {
        if (!val) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: USER_MESSAGE.FORGOT_PASSWORD_TOKEN_REQUIRED
          })
        }
        const decodedForgotPasswordToken = await verifyToken({
          token: val,
          privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        const { user_id } = decodedForgotPasswordToken
        const user = await databaseService.users.findOne({
          _id: new ObjectId(user_id)
        })
        if (user === null) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.NOT_FOUND,
            message: USER_MESSAGE.USER_NOT_FOUND
          })
        }
        if (user.forgot_password_token !== val) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: USER_MESSAGE.FORGOT_PASSWORD_TOKEN_INVALID
          })
        }
        req.decoded_forgot_password_token = decodedForgotPasswordToken
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

const userNameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.NAME_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGE.NAME_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 2,
      max: 50
    },
    errorMessage: USER_MESSAGE.NAME_LENGTH
  }
}

const userDateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USER_MESSAGE.DATE_OF_BIRTH_INVALID
  }
}

const imageURLSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGE.IMG_URL_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USER_MESSAGE.IMG_URL_LENGTH
  }
}

const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: USER_MESSAGE.USER_ID_INVALID
        })
      }
      const followedUser = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      if (followedUser === null) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: USER_MESSAGE.USER_NOT_FOUND
        })
      }
      return true
    }
  }
}

const loginValidator = checkSchema(
  {
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGE.EMAIL_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_INVALID
      },
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({
            email: value,
            password: hashPassword(req.body.password)
          })
          if (user === null) throw new Error(USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT)
          // MEMO: Assign value to `user` field in request for using in controller
          req.user = user
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
    name: userNameSchema,
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGE.EMAIL_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_INVALID
      },
      custom: {
        options: async (value) => {
          const isUniqueEmail = await usersService.isUniqueEmail(value)
          if (isUniqueEmail) return true
          throw new Error(USER_MESSAGE.EMAIL_ALREADY_EXISTS)
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: userDateOfBirthSchema
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

const forgotPasswordValidator = checkSchema(
  {
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGE.EMAIL_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_INVALID
      },
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({
            email: value
          })
          if (user === null) throw new Error(USER_MESSAGE.USER_NOT_FOUND)
          // MEMO: Assign value to `user` field in request for using in controller
          req.user = user
          return true
        }
      }
    }
  },
  ['body']
)
export const validateForgotPassword = validate(forgotPasswordValidator)

const forgotPasswordTokenValidator = checkSchema(
  {
    forgot_password_token: forgotPasswordTokenSchema
  },
  ['body']
)
export const validateForgotPasswordToken = validate(forgotPasswordTokenValidator)

const resetPasswordValidator = checkSchema(
  {
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    forgot_password_token: forgotPasswordTokenSchema
  },
  ['body']
)
export const validateResetPassword = validate(resetPasswordValidator)

// MEMO: This middleware must run after `validateAccessToken` middleware
export const validateVerifiedUser = (req: Request, res: Response, next: NextFunction) => {
  const { verify_status } = req.decoded_authorization as TokenPayload
  if (verify_status !== UserVerifyStatus.Verified) {
    // MEMO: Use `next(new Error)` to pass immediately to the error-handling middleware
    return next(
      new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: USER_MESSAGE.USER_NOT_VERIFIED
      })
    )
  }
  next()
}

const updateCurrentUserInfoValidator = checkSchema(
  {
    name: {
      ...userNameSchema,
      optional: true,
      notEmpty: undefined
    },
    date_of_birth: {
      ...userDateOfBirthSchema,
      optional: true
    },
    username: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.USERNAME_STRING
      },
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!USERNAME_REGEX.test(value)) {
            throw Error(USER_MESSAGE.USERNAME_INVALID)
          }
          const user = await databaseService.users.findOne({ username: value })
          if (user) {
            throw Error(USER_MESSAGE.USERNAME_EXIST)
          }
        }
      }
    },
    bio: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.BIO_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 200
        },
        errorMessage: USER_MESSAGE.BIO_LENGTH
      }
    },
    address: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.ADDRESS_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 200
        },
        errorMessage: USER_MESSAGE.ADDRESS_LENGTH
      }
    },
    website: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.WEBSITE_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 200
        },
        errorMessage: USER_MESSAGE.WEBSITE_LENGTH
      }
    },
    avatar: imageURLSchema,
    cover_photo: imageURLSchema
  },
  ['body']
)
export const validateUpdateCurrentUserInfo = validate(updateCurrentUserInfoValidator)

const followedUserValidator = checkSchema(
  {
    followed_user_id: userIdSchema
  },
  ['body']
)
export const validateFollowedUser = validate(followedUserValidator)

const unfollowUserValidator = checkSchema(
  {
    followed_user_id: userIdSchema
  },
  ['params']
)
export const validateUnfollowedUser = validate(unfollowUserValidator)

const changePasswordValidator = checkSchema(
  {
    old_password: {
      ...passwordSchema,
      custom: {
        options: async (value: string, { req }) => {
          const { user_id } = (req as Request).decoded_authorization as TokenPayload
          const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
          if (!user) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: USER_MESSAGE.USER_NOT_FOUND
            })
          }
          if (hashPassword(value) !== user.password) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
              message: USER_MESSAGE.OLD_PASSWORD_DOES_NOT_MATCH
            })
          }
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema
  },
  ['body']
)
export const validateChangePassword = validate(changePasswordValidator)
