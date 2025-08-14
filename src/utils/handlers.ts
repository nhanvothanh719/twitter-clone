import { NextFunction, Request, Response, RequestHandler } from 'express'

// MEMO: Use this to avoid try/catch in each controller
export const wrapRequestHandler = <T>(func: RequestHandler<T, any, any, any>) => {
  // MEMO: Use async/await to handle both sync and async functions
  return async (req: Request<T>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
