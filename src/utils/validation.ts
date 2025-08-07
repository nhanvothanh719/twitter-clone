import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'

export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validations.run(req)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      // MEMO: Return validation errors as an object. If a field has more than one error, only the first one is set in the resulting object.
      return res.status(400).json({ errors: errors.mapped() })
    }
    next()
  }
}
