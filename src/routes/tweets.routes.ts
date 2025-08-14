import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweets.controllers'
import { checkTweetAudienceType, validateCreateTweet, validateTweetId } from '~/middlewares/tweets.middlewares'
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
export default tweetsRouter
