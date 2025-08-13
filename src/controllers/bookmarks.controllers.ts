import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEET_MESSAGE } from '~/constants/messages'
import { BookmarkTweetRequestBody, RemoveBookmarkTweetRequestParams } from '~/models/requests/Bookmark.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarksService from '~/services/bookmarks.services'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.body
  const result = await bookmarksService.bookmarkTweet({ user_id, tweet_id })
  return res.json({
    message: TWEET_MESSAGE.BOOKMARK_SUCCESS,
    result
  })
}

export const removeBookmarkController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  const result = await bookmarksService.removeBookmarkTweet({ user_id, tweet_id })
  return res.json({
    message: TWEET_MESSAGE.REMOVE_BOOKMARK_SUCCESS,
    result
  })
}
