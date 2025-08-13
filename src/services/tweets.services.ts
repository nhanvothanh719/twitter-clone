import { TweetRequestBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId } from 'mongodb'

class TweetsService {
  async createTweet(payload: TweetRequestBody, userId: string) {
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        user_id: new ObjectId(userId),
        type: payload.type,
        audience: payload.audience,
        content: payload.content,
        hashtags: [], // TODO: Handle this
        mentions: payload.mentions,
        medias: payload.medias,
        parent_id: payload.parent_id
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }
}

const tweetsService = new TweetsService()
export default tweetsService
