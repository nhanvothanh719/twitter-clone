import { Query } from 'express-serve-static-core'
import { Pagination } from './Tweet.requests'
import { MediaTypeSearchString } from '~/constants/enums'

export interface SearchRequestQuery extends Pagination, Query {
  content: string
  media_type?: MediaTypeSearchString
  followed_people?: string
}
