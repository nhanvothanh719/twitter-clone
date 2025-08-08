import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { USER_MESSAGE } from '~/constants/messages'
import { UserLogoutRequestBody, UserRegistrationRequestBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
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
