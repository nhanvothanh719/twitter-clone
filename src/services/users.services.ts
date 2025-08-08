import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { UserRegistrationRequestBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import { StringValue } from 'ms'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'

// MEMO: Load `.env` file
config()

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
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(userId)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refreshToken, user_id: new ObjectId(userId) })
    )
    return { accessToken, refreshToken }
  }

  async isUniqueEmail(email: string) {
    const userWithCheckedEmail = await databaseService.users.findOne({ email })
    return !userWithCheckedEmail
  }

  async login(userId: string) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(userId)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refreshToken, user_id: new ObjectId(userId) })
    )
    return { accessToken, refreshToken }
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
        token_type: TokenType.RefreshToken
      },
      options: {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue) || '100d'
      }
    })
  }

  private signAccessAndRefreshToken(userId: string) {
    return Promise.all([this.signAccessToken(userId), this.signRefreshToken(userId)])
  }
}

const usersService = new UsersService()
export default usersService
