import { Router } from 'express'
import { createTweetController, getChildTweetsController, getTweetController } from '~/controllers/tweets.controllers'
import {
  checkTweetAudienceType,
  validateCreateTweet,
  validateGetChildTweets,
  validateTweetId
} from '~/middlewares/tweets.middlewares'
import { runIfLoggedIn, validateAccessToken, validateVerifiedUser } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Description: Create tweet
 * Path: /tweets/
 * Header: { Authorization: Bearer <access_token> }
 * Body: TweetRequestBody
 */
tweetsRouter.post(
  '/',
  validateAccessToken,
  validateVerifiedUser,
  validateCreateTweet,
  wrapRequestHandler(createTweetController)
)

/**
 * Description: Get tweet details
 * Path: /tweets/:tweet_id
 * Header: { Authorization?: Bearer <access_token> }
 */
tweetsRouter.get(
  '/:tweet_id',
  validateTweetId,
  runIfLoggedIn(validateAccessToken),
  runIfLoggedIn(validateVerifiedUser),
  checkTweetAudienceType,
  wrapRequestHandler(getTweetController)
)

/**
 * Description: Get comments, retweets, quote-tweets of a tweet
 * Path: /tweets/:tweet_id/children
 * Header: { Authorization?: Bearer <access_token> }
 * Query: { limit?: number, page?: number, tweet_type: TweetType }
 */
tweetsRouter.get(
  '/:tweet_id/children',
  validateTweetId,
  validateGetChildTweets,
  runIfLoggedIn(validateAccessToken),
  runIfLoggedIn(validateVerifiedUser),
  checkTweetAudienceType,
  wrapRequestHandler(getChildTweetsController)
)
export default tweetsRouter
