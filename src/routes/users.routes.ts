import { Router } from 'express'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController
} from '~/controllers/users.controllers'
import {
  validateAccessToken,
  validateEmailVerifyToken,
  validateRefreshToken,
  validateUserLogin,
  validateUserRegistration
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

/**
 * Description: Login
 * Path: /users/login
 * Body: { email: string, password: string }
 */
usersRouter.post('/login', validateUserLogin, wrapRequestHandler(loginController))
/**
 * Description: Register a new user
 * Path: /users/register
 * Body: { name: string, email: string, password: string, confirm_password: string, date_of_birth: string }
 */
usersRouter.post('/register', validateUserRegistration, wrapRequestHandler(registerController))
/**
 * Description: Logout
 * Path: /users/logout
 * Header: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', validateAccessToken, validateRefreshToken, wrapRequestHandler(logoutController))
/**
 * Description: Verify user's email
 * Path: /users/verify-email
 * Body: { email_verify_token: string }
 */
usersRouter.post('/verify-email', validateEmailVerifyToken, wrapRequestHandler(verifyEmailController))
/**
 * Description: Resend verify email
 * Path: /users/resend-verify-email
 * Header: { Authorization: Bearer <access_token> }
 * Body: {}
 */
usersRouter.post('/resend-verify-email', validateAccessToken, wrapRequestHandler(resendVerifyEmailController))

export default usersRouter
