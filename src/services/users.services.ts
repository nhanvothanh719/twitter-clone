import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { UserRegistrationRequestBody } from '~/models/schemas/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import { StringValue } from 'ms'

class UsersService {
  async register(payload: UserRegistrationRequestBody) {
    // Create new user
    const user = new User({
      ...payload,
      password: hashPassword(payload.password),
      date_of_birth: new Date(payload.date_of_birth)
    })
    const result = await databaseService.users.insertOne(user)

    // Create Access Token + Refresh Token
    const userId = result.insertedId.toString()
    const [accessToken, refreshToken] = await Promise.all([this.signAccessToken(userId), this.signRefreshToken(userId)])
    return { accessToken, refreshToken }
  }

  async isUnqueEmail(email: string) {
    const userWithCheckedEmail = await databaseService.users.findOne({ email })
    return !userWithCheckedEmail
  }

  private signAccessToken(userId: string) {
    return signToken({
      payload: {
        user_id: userId,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue) || '15m'
      }
    })
  }

  private signRefreshToken = (userId: string) => {
    return signToken({
      payload: {
        user_id: userId,
        token_type: TokenType.RefreshToen
      },
      options: {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue) || '100d'
      }
    })
  }
}

const usersService = new UsersService()
export default usersService
