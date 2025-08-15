import { TweetRequestBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { TweetType } from '~/constants/enums'

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
            from: process.env.DB_HASHTAGS_COLLECTION as string,
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        {
          $lookup: {
            from: process.env.DB_USERS_COLLECTION as string,
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
            from: process.env.DB_BOOKMARKS_COLLECTION as string,
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        // {
        //   $lookup: {
        //     from: 'likes',
        //     localField: '_id',
        //     foreignField: 'tweet_id',
        //     as: 'likes'
        //   }
        // },
        {
          $lookup: {
            from: process.env.DB_TWEETS_COLLECTION as string,
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
            // likes: {
            //   $size: '$likes'
            // },
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
    // Mutate result for displaying properly in client-side
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

  async getTweetsInNewsFeed({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const currentUserId = new ObjectId(user_id)
    const followedUsers = await databaseService.followers
      .find(
        {
          user_id: new ObjectId(user_id)
        },
        {
          projection: {
            followed_user_id: 1
          }
        }
      )
      .toArray()
    // Get tweets from current user and followed users
    const userIds = followedUsers.map((item) => item.followed_user_id)
    userIds.push(currentUserId)
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate<Tweet>([
          {
            $match: {
              user_id: {
                $in: userIds
              }
            }
          },
          {
            $lookup: {
              from: process.env.DB_USERS_COLLECTION as string,
              localField: 'user_id',
              foreignField: '_id',
              as: 'tweet_owner'
            }
          },
          {
            $unwind: {
              path: '$tweet_owner'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'tweet_owner.twitter_circle': {
                        $in: [currentUserId]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: limit * (page - 1) // MEMO: Put `$skip` and `$limit` after the last `$match` to improve performance
          },
          {
            $limit: limit
          },
          {
            $lookup: {
              from: process.env.DB_HASHTAGS_COLLECTION as string,
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: process.env.DB_USERS_COLLECTION as string,
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
              from: process.env.DB_BOOKMARKS_COLLECTION as string,
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'bookmarks'
            }
          },
          // {
          //   $lookup: {
          //     from: 'likes',
          //     localField: '_id',
          //     foreignField: 'tweet_id',
          //     as: 'likes'
          //   }
          // },
          {
            $lookup: {
              from: process.env.DB_TWEETS_COLLECTION as string,
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
              // likes: {
              //   $size: '$likes'
              // },
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
              tweet_children: 0,
              tweet_owner: {
                password: 0,
                email_verify_password: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: userIds
              }
            }
          },
          {
            $lookup: {
              from: process.env.DB_USERS_COLLECTION as string,
              localField: 'user_id',
              foreignField: '_id',
              as: 'tweet_owner'
            }
          },
          {
            $unwind: {
              path: '$tweet_owner'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'tweet_owner.twitter_circle': {
                        $in: [currentUserId]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total_tweets'
          }
        ])
        .toArray()
    ])
    // Increase views for tweets
    const tweetIds = tweets.map((tweet) => tweet._id as ObjectId)
    const date = new Date()
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweetIds
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    )
    // Mutate result for displaying properly in client-side
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      tweet.user_views += 1
    })

    return {
      tweets,
      total: Number(total[0].total_tweets)
    }
  }
}

const tweetsService = new TweetsService()
export default tweetsService
