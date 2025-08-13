import { Router } from 'express'
import { bookmarkTweetController, removeBookmarkController } from '~/controllers/bookmarks.controllers'
import { validateTweetId } from '~/middlewares/tweets.middlewares'
import { validateAccessToken, validateVerifiedUser } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()

/**
 * Description: Add new tweet bookmark
 * Path: /bookmarks/
 * Header: { Authorization: Bearer <access_token> }
 * Body: { tweet_id: string }
 */
bookmarksRouter.post(
  '/',
  validateAccessToken,
  validateVerifiedUser,
  validateTweetId,
  wrapRequestHandler(bookmarkTweetController)
)

/**
 * Description: Remove bookmark
 * Path: /bookmarks/tweets/:tweet_id
 * Header: { Authorization: Bearer <access_token> }
 */
bookmarksRouter.delete(
  '/tweets/:tweet_id',
  validateAccessToken,
  validateVerifiedUser,
  validateTweetId,
  wrapRequestHandler(removeBookmarkController)
)

export default bookmarksRouter
