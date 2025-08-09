import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { USER_MESSAGE } from '~/constants/messages'
import { TokenPayload, UserLogoutRequestBody, UserRegistrationRequestBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  // MEMO: Get `user` field from request which was assigned in `loginValidator`
  const user = req.user as User
  const userId = (user._id as ObjectId).toString() // MEMO: Convert from ObjectId to string
  const result = await usersService.login(userId)
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

export const emailVerifyController = async (req: Request, res: Response) => {
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
