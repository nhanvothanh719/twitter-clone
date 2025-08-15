import { ParamsDictionary, Query } from 'express-serve-static-core'
import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '../Others'

export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: string[]
  mentions: string[] // List of user ids
  medias: Media[]
}

export interface TweetRequestParams extends ParamsDictionary {
  tweet_id: string
}

export interface GetChildTweetsRequestQuery extends Query, Pagination {
  tweet_type: string
}

export interface Pagination extends Query {
  page: string
  limit: string
}
