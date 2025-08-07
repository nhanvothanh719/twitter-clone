import { ObjectId } from 'mongodb'

enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

interface IUser {
  _id?: ObjectId
  name: string
  email: string
  username?: string
  password: string
  date_of_birth: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify_status?: UserVerifyStatus
  bio?: string
  address?: string
  website?: string
  avatar?: string
  cover_photo?: string
  created_at?: Date
  updated_at?: Date
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  username: string
  password: string
  date_of_birth: Date
  email_verify_token: string
  forgot_password_token: string
  verify_status: UserVerifyStatus
  bio: string
  address: string
  website: string
  avatar: string
  cover_photo: string
  created_at: Date
  updated_at: Date

  constructor(user: IUser) {
    this._id = user._id
    this.name = user.name || ''
    this.email = user.email
    this.username = user.username || ''
    this.password = user.password
    this.date_of_birth = user.date_of_birth || new Date()
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify_status = user.verify_status || UserVerifyStatus.Unverified
    this.bio = user.bio || ''
    this.address = user.address || ''
    this.website = user.website || ''
    this.avatar = user.avatar || ''
    this.cover_photo = user.cover_photo || ''
    this.created_at = user.created_at || new Date()
    this.updated_at = user.updated_at || new Date()
  }
}
