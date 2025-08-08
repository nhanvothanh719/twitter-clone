import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { validateAccessToken, validateUserLogin, validateUserRegistration } from '~/middlewares/users.middlewares'
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
usersRouter.post(
  '/logout',
  validateAccessToken,
  wrapRequestHandler((req, res) => {
    res.json({
      message: 'OK'
    })
  })
)

export default usersRouter
