import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { UserRegistrationRequestBody } from '~/models/requests/User.requests'
import usersService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  // MEMO: Get `user` field from request which was assigned in `loginValidator`
  const { user }: any = req
  const userId = user._id.toString() // MEMO: Convert from ObjectId to string
  const result = await usersService.login(userId)
  return res.json({
    message: 'Login successfully',
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
    message: 'Register new user successfully',
    result
  })
}
