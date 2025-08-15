import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'
import { limitSchema, pageSchema } from './tweets.middlewares'
import { TWEET_MESSAGE } from '~/constants/messages'
import { MediaTypeSearchString } from '~/constants/enums'

const searchTweetsValidator = checkSchema(
  {
    page: pageSchema,
    limit: limitSchema,
    content: {
      isString: {
        errorMessage: TWEET_MESSAGE.CONTENT_MUST_BE_STRING
      },
      trim: true
    },
    media_type: {
      optional: true,
      isIn: {
        options: [Object.values(MediaTypeSearchString)]
      },
      errorMessage: `Media type must be one of ${Object.values(MediaTypeSearchString).join(', ')}`
    },
    followed_people: {
      optional: true,
      isIn: {
        options: ['true', 'false']
      },
      errorMessage: `Followed people must be 'true' or 'false'`
    }
  },
  ['query']
)
export const validateSearchTweets = validate(searchTweetsValidator)
