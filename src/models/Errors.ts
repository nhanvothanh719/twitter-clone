import { HTTP_STATUS } from '~/constants/httpStatuses'
import { USER_MESSAGE } from '~/constants/messages'

// MEMO: This class is not inherited from the `Error` class
export class ErrorWithStatus {
  message: string
  status: number

  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class InputValidationError extends ErrorWithStatus {
  errors: ErrorsType

  constructor({ message = USER_MESSAGE.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
