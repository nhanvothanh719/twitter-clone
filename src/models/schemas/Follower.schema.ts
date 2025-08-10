import { ObjectId } from 'mongodb'

interface IFollower {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
}

export default class Follower {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at: Date

  constructor({ user_id, followed_user_id, created_at }: IFollower) {
    this.user_id = user_id
    this.followed_user_id = followed_user_id
    this.created_at = created_at || new Date()
  }
}
