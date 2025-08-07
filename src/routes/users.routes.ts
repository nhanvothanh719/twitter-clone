import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { validateUserLogin, validateUserRegistration } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.post('/login', validateUserLogin, wrapRequestHandler(loginController))
usersRouter.post('/register', validateUserRegistration, wrapRequestHandler(registerController))

export default usersRouter
