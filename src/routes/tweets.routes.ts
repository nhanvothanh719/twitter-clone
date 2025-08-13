import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controllers'
import { validateCreateTweet } from '~/middlewares/tweets.middlewares'
import { validateAccessToken, validateVerifiedUser } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Description: Create tweet
 * Path: /
 * Header:
 * Body: TweetRequestBody
 */
tweetsRouter.post(
  '/',
  validateAccessToken,
  validateVerifiedUser,
  validateCreateTweet,
  wrapRequestHandler(createTweetController)
)

export default tweetsRouter
