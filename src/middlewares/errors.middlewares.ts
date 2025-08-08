import { NextFunction, Request, Response } from 'express'
import _ from 'lodash'
import { json } from 'stream/consumers'
import { HTTP_STATUS } from '~/constants/httpStatuses'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // If `err` is instance of ErrorWithStatus || InputValidationError
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(_.omit(err, 'status'))
  }

  // Some properties of Error object are non-enumerable
  // -> Make sure all info of `err` is displayed in the returned JSON object
  const errPropertyNames = Object.getOwnPropertyNames(err)
  errPropertyNames.forEach((propertyName) => {
    Object.defineProperty(err, propertyName, { enumerable: true })
  })

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: _.omit(err, 'stack')
  })
}
