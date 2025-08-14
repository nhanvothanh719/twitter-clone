import { TweetRequestBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { TweetType } from '~/constants/enums'
import { update } from 'lodash'

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

  async increaseView(tweetId: string, userId?: string) {
    const increase = userId ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweetId) },
      {
        $inc: increase,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )
    return result as WithId<{ guest_views: number; user_views: number; updated_at: Date }>
  }

  async getChildTweets({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
    user_id: string | undefined
  }) {
    const filterConditions = {
      parent_id: new ObjectId(tweet_id),
      type: tweet_type
    }
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: filterConditions
        },
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'mentions',
            foreignField: '_id',
            as: 'mentions'
          }
        },
        {
          $addFields: {
            mentions: {
              $map: {
                input: '$mentions',
                as: 'mention',
                in: {
                  _id: '$$mention._id',
                  name: '$$mention.name',
                  username: '$$mention.username',
                  email: '$$mention.email'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          $lookup: {
            from: 'tweets',
            localField: '_id',
            foreignField: 'parent_id',
            as: 'tweet_children'
          }
        },
        {
          $addFields: {
            bookmarks: {
              $size: '$bookmarks'
            },
            likes: {
              $size: '$likes'
            },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Retweet]
                  }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Comment]
                  }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_children: 0
          }
        },
        {
          $skip: limit * (page - 1) // Công thức phân trang (page >= 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const increase = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()
    const [, total] = await Promise.all([
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: increase,
          $set: {
            updated_at: date
          }
        }
      ),
      databaseService.tweets.countDocuments(filterConditions)
    ])
    // Mutate result
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })

    return {
      tweets,
      total
    }
  }
}

const tweetsService = new TweetsService()
export default tweetsService
