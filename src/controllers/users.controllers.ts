import { Request, Response } from 'express'
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

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const result = await usersService.register({ email, password })
    return res.json({
      message: 'Register new user successfully',
      result
    })
  } catch (error) {
    console.error('Failed to register new user: ', error)
    return res.status(400).json({
      message: 'Failed to register new user',
      error: error
    })
  }
}
