import { ObjectId } from 'mongodb'

interface IRefreshToken {
  _id?: ObjectId
  token: string
  user_id: ObjectId
  created_at?: Date
  iat: number //MEMO: iat <=> issued_at
  exp: number //exp <=> expired_time
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  user_id: ObjectId
  created_at: Date
  iat: Date
  exp: Date

  constructor({ token, user_id, created_at, iat, exp }: IRefreshToken) {
    this.token = token
    this.user_id = user_id
    this.created_at = created_at || new Date()
    // Convert from Epoch time to Date
    this.iat = new Date(iat * 1000)
    this.exp = new Date(exp * 1000)
  }
}
