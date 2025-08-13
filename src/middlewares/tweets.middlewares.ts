import { checkSchema, ParamSchema } from 'express-validator'
import _ from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType } from '~/constants/enums'
import { TWEET_MESSAGE } from '~/constants/messages'
import { enumToNumbersArray } from '~/utils/common'
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
