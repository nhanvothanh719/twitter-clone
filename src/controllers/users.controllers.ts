import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { UserRegistrationRequestBody } from '~/models/requests/User.requests'
import usersService from '~/services/users.services'

export const loginController = (req: Request, res: Response) => {
  const HASH_CODE_EMAIL = 'nhanvt@gmail.com'
  const HASH_CODE_PASSWORD = '1234rewq'

  const { email, password } = req.body
  if (email === HASH_CODE_EMAIL && password === HASH_CODE_PASSWORD) {
    // MEMO: Default status is 200
    return res.json({
      message: 'Login successfully'
    })
  }
  return res.status(400).json({
    message: 'Incorrect email or password'
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
