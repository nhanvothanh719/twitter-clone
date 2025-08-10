import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'

export interface UserLoginRequestBody {
  email: string
  password: string
}

export interface UserRegistrationRequestBody {
  email: string
  password: string
  confirm_password: string
  name: string
  date_of_birth: string
}

export interface UserLogoutRequestBody {
  refresh_token: string
}

export interface VerifyEmailRequestBody {
  email_verify_token: string
}

export interface ForgotPasswordRequestBody {
  email: string
}

export interface VerifyForgotPasswordTokenRequestBody {
  forgot_password_token: string
}

export interface ResetPasswordRequestBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface UpdateUserInfoRequestBody {
  name?: string
  username?: string
  date_of_birth?: string
  bio?: string
  address?: string
  website?: string
  avatar?: string
  cover_photo?: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  verify_status: UserVerifyStatus
  token_type: TokenType
}
