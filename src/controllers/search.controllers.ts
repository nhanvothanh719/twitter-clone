import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { SearchRequestQuery } from '~/models/requests/Search.requests'
import searchService from '~/services/search.services'

export const searchTweets = async (req: Request<ParamsDictionary, any, any, SearchRequestQuery>, res: Response) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const content = req.query.content ?? ''
  const media_type = req.query?.media_type
  const followedPeopleString = req.query?.followed_people
  let followed_people: boolean | undefined = undefined
  if (followedPeopleString === 'true') followed_people = true
  const user_id = req.decoded_authorization?.user_id as string
  const result = await searchService.searchTweets({ limit, page, content, user_id, media_type, followed_people })
  return res.json({
    result: {
      tweets: result.tweets,
      limit,
      page,
      total_pages: Math.ceil(result.total / limit)
    }
  })
}
