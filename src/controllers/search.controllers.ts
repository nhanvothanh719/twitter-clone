import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { SearchRequestQuery } from '~/models/requests/Search.requests'
import searchService from '~/services/search.services'

export const searchTweetsByContentController = async (
  req: Request<ParamsDictionary, any, any, SearchRequestQuery>,
  res: Response
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const content = req.query.content ?? ''
  const user_id = req.decoded_authorization?.user_id as string
  const result = await searchService.searchTweetsByContent({ limit, page, content, user_id })
  return res.json({
    result: {
      tweets: result.tweets,
      limit,
      page,
      total_pages: Math.ceil(result.total / limit)
    }
  })
}
