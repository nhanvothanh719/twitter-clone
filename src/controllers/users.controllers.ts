import { Request, Response } from 'express'

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
    error: 'Incorrect email or password'
  })
}
