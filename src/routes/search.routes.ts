import { Router } from 'express'
import { searchTweets } from '~/controllers/search.controllers'

const searchRouter = Router()

/**
 * Description: Search tweets by content, media_type
 * Path: /search
 * Header:
 * Body: Query: { limit: number, page: number, content: string, media_type: MediaTypeSearchString }
 */
searchRouter.get('/', searchTweets)

export default searchRouter
