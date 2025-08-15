import { Router } from 'express'
import { searchTweetsByContentController } from '~/controllers/search.controllers'

const searchRouter = Router()

/**
 * Description: Search tweets by content
 * Path: /search
 * Header:
 * Body: Query: { limit: number, page: number, content: string }
 */
searchRouter.get('/', searchTweetsByContentController)

export default searchRouter
