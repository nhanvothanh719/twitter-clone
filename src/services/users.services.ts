import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { UserRegistrationRequestBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { StringValue } from 'ms'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'

// MEMO: Load `.env` file
config()

class UsersService {
  async register(payload: UserRegistrationRequestBody) {
    const userId = new ObjectId()
    const emailVerifyToken = await this.signEmailVerifyToken(userId.toString())
    // Create new user
    const user = new User({
      ...payload,
      _id: userId,
      password: hashPassword(payload.password),
      date_of_birth: new Date(payload.date_of_birth),
      email_verify_token: emailVerifyToken
    })
    await databaseService.users.insertOne(user)

    // Create Access Token + Refresh Token
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(userId.toString())
    await databaseService.refreshTokens.insertOne(new RefreshToken({ token: refreshToken, user_id: userId }))

    // TODO: Send verify email
    console.log('>>> Email verify token: ', emailVerifyToken)

    return { access_token: accessToken, refresh_token: refreshToken }
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
    return { access_token: accessToken, refresh_token: refreshToken }
  }

  async logout(refreshToken: string) {
    const result = await databaseService.refreshTokens.deleteOne({ token: refreshToken })
    return result
  }

  async verifyEmail(userId: string) {
    // Get access token + refresh token & Mark as verified user
    const [[accessToken, refreshToken], _] = await Promise.all([
      this.signAccessAndRefreshToken(userId.toString()),
      databaseService.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            email_verify_token: '',
            verify_status: UserVerifyStatus.Verified,
            updated_at: new Date()
          }
        }
      )
    ])
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refreshToken, user_id: new ObjectId(userId) })
    )

    return { access_token: accessToken, refresh_token: refreshToken }
  }

  async resendVerifyEmail(userId: string) {
    const newEmailVerifyToken = await this.signEmailVerifyToken(userId)

    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          email_verify_token: newEmailVerifyToken
        },
        // MEMO: Set the value `updated_at` to the time the db updating value in document
        $currentDate: {
          updated_at: true
        }
      }
    )

    // TODO: Resend verify email
    console.log('>>> Email verify token: ', newEmailVerifyToken)

    return true
  }

  private signAccessToken(userId: string) {
    return signToken({
      payload: {
        user_id: userId,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
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
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue) || '100d'
      }
    })
  }

  private signAccessAndRefreshToken(userId: string) {
    return Promise.all([this.signAccessToken(userId), this.signRefreshToken(userId)])
  }

  private signEmailVerifyToken(userId: string) {
    return signToken({
      payload: {
        user_id: userId,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue) || '100d'
      }
    })
  }
}

const usersService = new UsersService()
export default usersService
