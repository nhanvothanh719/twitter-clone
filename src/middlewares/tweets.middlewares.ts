import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import _ from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { TWEET_MESSAGE, USER_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'
import { enumToNumbersArray } from '~/utils/common'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  isNormalTweetType,
  isRetweetOrQuoteTweetOrCommentType,
  isRetweetType,
  isTweetOrQuoteTweetOrCommentType
} from '~/utils/tweet'
import { validate } from '~/utils/validation'

const tweetTypeIds = enumToNumbersArray(TweetType)
const tweetAudienceIds = enumToNumbersArray(TweetAudience)
const mediaTypeIds = enumToNumbersArray(MediaType)

const createTweetValidator = checkSchema(
  {
    type: {
      isIn: {
        options: [tweetTypeIds],
        errorMessage: TWEET_MESSAGE.TYPE_INVALID
      }
    },
    audience: {
      isIn: {
        options: [tweetAudienceIds],
        errorMessage: TWEET_MESSAGE.AUDIENCE_INVALID
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          if (isNormalTweetType(type) && value !== null) {
            throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_NULL)
          }
          if (isRetweetOrQuoteTweetOrCommentType(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEET_MESSAGE.PARENT_ID_INVALID)
          }
          return true
        }
      }
    },
    content: {
      isString: {
        errorMessage: TWEET_MESSAGE.CONTENT_MUST_BE_STRING
      },
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          if (isTweetOrQuoteTweetOrCommentType(type) && _.isEmpty(hashtags) && _.isEmpty(mentions) && value === '') {
            throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          if (isRetweetType(type) && value !== '') {
            throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_AN_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Check if every item in `hashtags` is string
          if (value.some((item: any) => typeof item !== 'string')) {
            throw new Error(TWEET_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value) => {
          // Check if every item in `mentions` is ObjectId
          if (value.some((item: any) => !ObjectId.isValid(item))) {
            throw new Error(TWEET_MESSAGE.MENTIONS_CONTAIN_INVALID_USER_ID)
          }
          return true
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Check if every item in `medias` is Media object
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' || !mediaTypeIds.includes(item.type)
            })
          ) {
            throw new Error(TWEET_MESSAGE.MEDIAS_INVALID)
          }
          return true
        }
      }
    }
  },
  ['body']
)
export const validateCreateTweet = validate(createTweetValidator)

const tweetIdValidator = checkSchema(
  {
    tweet_id: {
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.BAD_REQUEST,
              message: TWEET_MESSAGE.ID_INVALID
            })
          }
          // MEMO: Use destructuring to get the first item in the array
          const [tweet] = await databaseService.tweets
            .aggregate<Tweet>([
              {
                $match: {
                  _id: new ObjectId(value)
                }
              },
              {
                $lookup: {
                  from: process.env.DB_HASHTAGS_COLLECTION,
                  localField: 'hashtags',
                  foreignField: '_id',
                  as: 'hashtags'
                }
              },
              {
                $lookup: {
                  from: process.env.DB_USERS_COLLECTION,
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
                  from: process.env.DB_BOOKMARKS_COLLECTION,
                  localField: '_id',
                  foreignField: 'tweet_id',
                  as: 'bookmarks'
                }
              },
              // TODO: Develop like function
              // {
              //   $lookup: {
              //     from: 'likes',
              //     localField: '_id',
              //     foreignField: 'tweet_id',
              //     as: 'likes'
              //   }
              // },
              // ===
              {
                $lookup: {
                  from: process.env.DB_TWEETS_COLLECTION,
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
              }
            ])
            .toArray()
          if (!tweet) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: TWEET_MESSAGE.TWEET_NOT_FOUND
            })
          }
          req.tweet = tweet
          return true
        }
      }
    }
  },
  ['params', 'body']
)
export const validateTweetId = validate(tweetIdValidator)

// MEMO: This middleware must be called after validateAccessToken and tweetIdValidator
// MEMO: Since this is an async handler => it must contain try-catch or wrapped by `wrapRequestHandler`
export const checkTweetAudienceType = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience !== TweetAudience.TwitterCircle) return next()
  // Check if user viewing the tweet has logged in
  if (!req.decoded_authorization) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USER_MESSAGE.USER_UNAUTHORIZED
    })
  }
  // Check if tweet's owner is banned or deleted
  const tweetAuthor = await databaseService.users.findOne({
    _id: new ObjectId(tweet.user_id)
  })
  if (!tweetAuthor || tweetAuthor.verify_status === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  // Check if the viewer is included in owner's twitter_circle or tweet's author
  const { user_id } = req.decoded_authorization as TokenPayload
  const isIncludedInTwitterCircle = tweetAuthor.twitter_circle.some((userId) => userId.equals(user_id))
  const isTweetOwner = tweetAuthor._id.equals(user_id)
  if (!isTweetOwner && !isIncludedInTwitterCircle) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: TWEET_MESSAGE.USER_FORBIDDEN
    })
  }
  next()
})
