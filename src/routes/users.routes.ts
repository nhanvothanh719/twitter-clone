import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { validateUserLogin, validateUserRegistration } from '~/middlewares/users.middlewares'

const usersRouter = Router()

usersRouter.post('/login', validateUserLogin, loginController)
usersRouter.post('/register', validateUserRegistration, registerController)

export default usersRouter
