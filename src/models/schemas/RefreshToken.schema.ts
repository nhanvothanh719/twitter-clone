import { ObjectId } from 'mongodb'

interface IRefreshToken {
  _id?: ObjectId
  token: string
  user_id: ObjectId
  created_at?: Date
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  user_id: ObjectId
  created_at: Date

  constructor({ token, user_id, created_at }: IRefreshToken) {
    this.token = token
    this.user_id = user_id
    this.created_at = created_at || new Date()
  }
}
