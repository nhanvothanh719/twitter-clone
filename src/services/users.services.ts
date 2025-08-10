import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { UpdateUserInfoRequestBody, UserRegistrationRequestBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { StringValue } from 'ms'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { ErrorWithStatus } from '~/models/Errors'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { USER_MESSAGE } from '~/constants/messages'
import Follower from '~/models/schemas/Follower.schema'

// MEMO: Load `.env` file
config()

class UsersService {
  async register(payload: UserRegistrationRequestBody) {
    const userId = new ObjectId()
    const emailVerifyToken = await this.signEmailVerifyToken({
      user_id: userId.toString(),
      verify_status: UserVerifyStatus.Unverified
    })
    // Create new user
    const user = new User({
      ...payload,
      _id: userId,
      username: `user_${userId.toString()}`,
      password: hashPassword(payload.password),
      date_of_birth: new Date(payload.date_of_birth),
      email_verify_token: emailVerifyToken
    })
    await databaseService.users.insertOne(user)

    // Create Access Token + Refresh Token
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      user_id: userId.toString(),
      verify_status: UserVerifyStatus.Unverified
    })
    await databaseService.refreshTokens.insertOne(new RefreshToken({ token: refreshToken, user_id: userId }))

    // TODO: Send verify email
    console.log('>>> Email verify token: ', emailVerifyToken)

    return { access_token: accessToken, refresh_token: refreshToken }
  }

  async isUniqueEmail(email: string) {
    const userWithCheckedEmail = await databaseService.users.findOne({ email })
    return !userWithCheckedEmail
  }

  async login({ user_id, verify_status }: { user_id: string; verify_status: UserVerifyStatus }) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({ user_id, verify_status })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refreshToken, user_id: new ObjectId(user_id) })
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
      this.signAccessAndRefreshToken({ user_id: userId, verify_status: UserVerifyStatus.Verified }),
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
    const newEmailVerifyToken = await this.signEmailVerifyToken({
      user_id: userId,
      verify_status: UserVerifyStatus.Unverified
    })

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

  async forgotPassword({ user_id, verify_status }: { user_id: string; verify_status: UserVerifyStatus }) {
    const forgotPasswordToken = await this.signForgotPasswordToken({ user_id, verify_status })
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token: forgotPasswordToken,
          updated_at: new Date()
        }
      }
    )

    //TODO: Send email including link for password reset
    console.log('>>> Forgot password token: ', forgotPasswordToken)

    return true
  }

  async resetPassword(userId: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: new Date()
        }
      }
    )
  }

  async getPublicUserInfoById(userId: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async updateUserInfo(userId: string, payload: UpdateUserInfoRequestBody) {
    const { date_of_birth, ...rest } = payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...rest,
          ...(date_of_birth && { date_of_birth: new Date(date_of_birth) }),
          updated_at: new Date()
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async getUserProfileByUsername(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USER_MESSAGE.USER_NOT_FOUND
      })
    }
    return user
  }

  async follow(userId: string, followedUserId: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(userId),
      followed_user_id: new ObjectId(followedUserId)
    })
    if (follower) {
      return {
        message: USER_MESSAGE.USER_FOLLOW_EXIST
      }
    }
    await databaseService.followers.insertOne(
      new Follower({ user_id: new ObjectId(userId), followed_user_id: new ObjectId(followedUserId) })
    )
    return { message: USER_MESSAGE.USER_FOLLOW_SUCCESS }
  }

  async unfollow(userId: string, followedUserId: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(userId),
      followed_user_id: new ObjectId(followedUserId)
    })
    if (!follower) {
      return {
        message: USER_MESSAGE.USER_FOLLOW_NOT_EXIST
      }
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(userId),
      followed_user_id: new ObjectId(followedUserId)
    })
    return { message: USER_MESSAGE.USER_UNFOLLOW_SUCCESS }
  }

  private signAccessToken({ user_id, verify_status }: { user_id: string; verify_status: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify_status,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue) || '15m'
      }
    })
  }

  private signRefreshToken = ({ user_id, verify_status }: { user_id: string; verify_status: UserVerifyStatus }) => {
    return signToken({
      payload: {
        user_id,
        verify_status,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue) || '100d'
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify_status }: { user_id: string; verify_status: UserVerifyStatus }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify_status }),
      this.signRefreshToken({ user_id, verify_status })
    ])
  }

  private signEmailVerifyToken({ user_id, verify_status }: { user_id: string; verify_status: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify_status,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: (process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as StringValue) || '100d'
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify_status }: { user_id: string; verify_status: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify_status,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: (process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue) || '100d'
      }
    })
  }
}

const usersService = new UsersService()
export default usersService
