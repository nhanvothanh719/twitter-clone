import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { MediaType, MediaTypeSearchString, TweetType } from '~/constants/enums'

class SearchService {
  async searchTweets({
    content,
    limit,
    page,
    user_id,
    media_type,
    followed_people
  }: {
    content: string
    limit: number
    page: number
    user_id: string
    media_type?: MediaTypeSearchString
    followed_people?: boolean
  }) {
    const $match: any = {
      $text: {
        $search: content
      }
    }

    if (media_type) {
      if (media_type === MediaTypeSearchString.Image) {
        $match['medias.type'] = MediaType.Image
      } else if (media_type === MediaTypeSearchString.Video) {
        $match['medias.type'] = {
          $in: [MediaType.Video, MediaType.HLS]
        }
      }
    }

    if (typeof followed_people === 'boolean' && followed_people === true) {
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
      userIds.push(new ObjectId(user_id))

      $match['user_id'] = {
        $in: userIds
      }
    }

    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: 'users',
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
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
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
              tweet_children: 0,
              tweet_owner: {
                password: 0,
                email_verify_password: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: 'users',
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
                        $in: [new ObjectId(user_id)]
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
      total: total[0]?.total_tweets ? Number(total[0].total_tweets) : 0
    }
  }
}

const searchService = new SearchService()
export default searchService
