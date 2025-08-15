import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enums'
import { TWEET_MESSAGE } from '~/constants/messages'
import {
  GetChildTweetsRequestQuery,
  Pagination,
  TweetRequestBody,
  TweetRequestParams
} from '~/models/requests/Tweet.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import Tweet from '~/models/schemas/Tweet.schema'
import tweetsService from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(req.body, user_id)
  return res.json({
    message: TWEET_MESSAGE.CREATE_SUCCESS,
    result
  })
}

export const getTweetController = async (req: Request, res: Response) => {
  const tweet = req.tweet as Tweet
  const result = await tweetsService.increaseView(tweet._id!.toString(), req.decoded_authorization?.user_id)
  const updatedTweet: Tweet = {
    ...tweet,
    user_views: result.user_views,
    guest_views: result.guest_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: TWEET_MESSAGE.GET_SUCCESS,
    result: updatedTweet
  })
}

export const getChildTweetsController = async (
  req: Request<TweetRequestParams, any, any, GetChildTweetsRequestQuery>,
  res: Response
) => {
  const user_id = req.decoded_authorization?.user_id
  const tweet_type = Number(req.query.tweet_type) as TweetType
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const { tweets, total } = await tweetsService.getChildTweets({
    tweet_id: req.params.tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  })
  const total_pages = Math.ceil(total / limit)
  return res.json({
    message: TWEET_MESSAGE.GET_CHILDREN_SUCCESS,
    result: {
      tweets,
      tweet_type,
      limit,
      page,
      total,
      total_pages
    }
  })
}

export const getTweetsInNewsFeedController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await tweetsService.getTweetsInNewsFeed({ user_id, page, limit })
  const total_pages = Math.ceil(result.total / limit)
  return res.json({
    message: TWEET_MESSAGE.GET_NEW_FEEDS_SUCCESS,
    result: {
      ...result,
      limit,
      page,
      total_pages
    }
  })
}
