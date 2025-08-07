import { NextFunction, Request, Response } from 'express'
import _ from 'lodash'
import { HTTP_STATUS } from '~/constants/httpStatuses'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorStatusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
  // MEMO: Return error with errorStatusCode status code and only message
  res.status(errorStatusCode).json(_.omit(err, 'status'))
}
