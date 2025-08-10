import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { result } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { USER_MESSAGE } from '~/constants/messages'
import {
  ForgotPasswordRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  UserLoginRequestBody,
  UserLogoutRequestBody,
  UserRegistrationRequestBody,
  VerifyEmailRequestBody,
  VerifyForgotPasswordTokenRequestBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'

export const loginController = async (req: Request<ParamsDictionary, any, UserLoginRequestBody>, res: Response) => {
  // MEMO: Get `user` field from request which was assigned in `loginValidator`
  const user = req.user as User
  const userId = (user._id as ObjectId).toString() // MEMO: Convert from ObjectId to string
  const result = await usersService.login({ user_id: userId, verify_status: user.verify_status })
  return res.json({
    message: USER_MESSAGE.USER_LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, UserRegistrationRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({
    message: USER_MESSAGE.USER_REGISTER_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, UserLogoutRequestBody>, res: Response) => {
  const { refresh_token } = req.body
  const isSuccess = await usersService.logout(refresh_token)
  if (isSuccess) {
    return res.json({
      message: USER_MESSAGE.USER_LOGOUT_SUCCESS
    })
  }
}

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, VerifyEmailRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  // MEMO: Using `user_id` in finding condition for better performance
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // If user cannot be found
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  // If user's email was verified <=> `user.email_verify_token = ''`
  if (user.email_verify_token === '' && user.verify_status === UserVerifyStatus.Verified) {
    return res.json({
      message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED
    })
  }

  const result = await usersService.verifyEmail(user_id)

  return res.json({
    message: USER_MESSAGE.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  if (user.verify_status === UserVerifyStatus.Verified) {
    return res.json({
      message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED
    })
  }
  await usersService.resendVerifyEmail(user_id)
  return res.json({
    message: USER_MESSAGE.RESEND_EMAIL_VERIFY_SUCCESS
  })
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response
) => {
  const { _id, verify_status } = req.user as User
  await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    verify_status
  })
  return res.json({
    message: USER_MESSAGE.RESET_PASSWORD_CHECK_EMAIL
  })
}

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordTokenRequestBody>,
  res: Response
) => {
  return res.json({
    message: USER_MESSAGE.FORGOT_PASSWORD_VERIFY_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  await usersService.resetPassword(user_id, password)
  return res.json({
    message: USER_MESSAGE.RESET_PASSWORD_SUCCESS
  })
}

export const getCurrentUserInfoController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getPublicUserInfoById(user_id)
  return res.json({
    message: USER_MESSAGE.GET_USER_INFO_SUCCESS,
    result: user
  })
}
