import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enums'

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

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}
