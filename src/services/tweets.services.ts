import { TweetRequestBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'

class TweetsService {
  async createTweet(payload: TweetRequestBody, userId: string) {
    const hashtags = await this.checkAndCreateHashtags(payload.hashtags)
    const hashtagIds = hashtags.map((item) => (item as WithId<Hashtag>)._id)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        user_id: new ObjectId(userId),
        type: payload.type,
        audience: payload.audience,
        content: payload.content,
        hashtags: hashtagIds,
        mentions: payload.mentions,
        medias: payload.medias,
        parent_id: payload.parent_id
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async checkAndCreateHashtags(hashtags: string[]) {
    // MEMO: For each item in `hashtags`, find or insert a new document.
    // - If found: return existing document
    // - If not found: insert new Hashtag with given name
    const hashtagDocuments = await Promise.all(
      hashtags.map((item: string) => {
        // MEMO: `_id` will not automatically created when using `findOneAndUpdate`
        return databaseService.hashtags.findOneAndUpdate(
          {
            name: item
          },
          {
            $setOnInsert: new Hashtag({
              name: item
            })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )
    return hashtagDocuments
  }
}

const tweetsService = new TweetsService()
export default tweetsService
