import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEET_MESSAGE } from '~/constants/messages'
import { TweetRequestBody } from '~/models/requests/Tweet.requests'
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
    guest_views: result.guest_views
  }
  return res.json({
    message: TWEET_MESSAGE.GET_SUCCESS,
    result: updatedTweet
  })
}
