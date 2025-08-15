import { Router } from 'express'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordTokenController,
  resetPasswordController,
  getCurrentUserInfoController,
  updateCurrentUserInfoController,
  getUserProfileController,
  followController,
  unfollowController,
  changePasswordController,
  googleOauthController,
  refreshTokenController
} from '~/controllers/users.controllers'
import { fieldsFilter } from '~/middlewares/common.middlewares'
import {
  validateAccessToken,
  validateChangePassword,
  validateEmailVerifyToken,
  validateFollowedUser,
  validateForgotPassword,
  validateForgotPasswordToken,
  validateRefreshToken,
  validateResetPassword,
  validateUnfollowedUser,
  validateUpdateCurrentUserInfo,
  validateUserLogin,
  validateUserRegistration,
  validateVerifiedUser
} from '~/middlewares/users.middlewares'
import { UpdateUserInfoRequestBody } from '~/models/requests/User.requests'
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
 * Description: Refresh access token when it is expired
 * Path: /users/refresh-token
 * Body: { refresh_token: string }
 */
usersRouter.post('/refresh-token', validateRefreshToken, wrapRequestHandler(refreshTokenController))

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

/**
 * Description: Submit email to reset password -> send email to user
 * Path: /users/forgot-password
 * Body: { email: string }
 */
usersRouter.post('/forgot-password', validateForgotPassword, wrapRequestHandler(forgotPasswordController))

/**
 * Description: Verify forgot password token
 * Path: /users/verify-forgot-password-token
 * Body: { forgot_password_token: string }
 */
usersRouter.post(
  '/verify-forgot-password-token',
  validateForgotPasswordToken,
  wrapRequestHandler(verifyForgotPasswordTokenController)
)

/**
 * Description: Reset password
 * Path: /users/reset-password
 * Body: { forgot_password_token: string, password: string, confirm_password: string }
 */
usersRouter.post('/reset-password', validateResetPassword, wrapRequestHandler(resetPasswordController))

/**
 * Description: Get current user info
 * Path: /users/me
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/me', validateAccessToken, wrapRequestHandler(getCurrentUserInfoController))

/**
 * Description: Update current user info
 * Path: /users/me
 * Header: { Authorization: Bearer <access_token> }
 * Body: { avatar, ... }
 */
usersRouter.patch(
  '/me',
  validateAccessToken,
  validateVerifiedUser,
  validateUpdateCurrentUserInfo,
  fieldsFilter<UpdateUserInfoRequestBody>([
    'name',
    'username',
    'date_of_birth',
    'bio',
    'address',
    'website',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateCurrentUserInfoController)
)

/**
 * Description: Get user profile
 * Path: /users/:username
 */
usersRouter.get('/:username', wrapRequestHandler(getUserProfileController))

/**
 * Description: Follow one user
 * Path: /users/follow
 * Header: { Authorization: Bearer <access_token> }
 * Body: { followed_user_id: string }
 */
usersRouter.post(
  '/follow',
  validateAccessToken,
  validateVerifiedUser,
  validateFollowedUser,
  wrapRequestHandler(followController)
)

/**
 * Description: Unfollow one user
 * Path: /users/follow/:followed_user_id
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.delete(
  '/follow/:followed_user_id',
  validateAccessToken,
  validateVerifiedUser,
  validateUnfollowedUser,
  wrapRequestHandler(unfollowController)
)

/**
 * Description: Change password
 * Path: /users/change-password
 * Header: { Authorization: Bearer <access_token> }
 * Body: { old_password: string, password: string, confirm_password: string}
 */
usersRouter.put(
  '/change-password',
  validateAccessToken,
  validateVerifiedUser,
  validateChangePassword,
  wrapRequestHandler(changePasswordController)
)

/**
 * Description: OAuth with Google
 * Path: /users/oauth/google
 * Query: { code: string }
 */
usersRouter.get('/oauth/google', wrapRequestHandler(googleOauthController))

export default usersRouter
