import { Router } from 'express'
import { searchTweets } from '~/controllers/search.controllers'
import { validateAccessToken, validateVerifiedUser } from '~/middlewares/users.middlewares'

const searchRouter = Router()

/**
 * Description: Search tweets by content, media_type
 * Path: /search
 * Header: { Authorization: Bearer <access_token> }
 * Body: Query: { limit: number, page: number, content: string, media_type: MediaTypeSearchString }
 */
searchRouter.get('/', validateAccessToken, validateVerifiedUser, searchTweets)

export default searchRouter
