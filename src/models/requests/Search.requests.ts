import { Query } from 'express-serve-static-core'
import { Pagination } from './Tweet.requests'

export interface SearchRequestQuery extends Pagination, Query {
  content: string
}
