import { HttpStatus } from "../constant/httpStatus";
import { MESSAGES } from "../constant/messages";
import { AppError } from "./AppError";
export class SubscriptionAlreadyExist extends AppError {
  constructor(message = MESSAGES.ERRORS.SUBSCRIPTION_EXISIT) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
export class UpdateSubscriptionError extends AppError {
  constructor(message = MESSAGES.ERRORS.SUBSCRIPTION_UPDATE_FAILED) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
export class DeleteSubcriptionError extends AppError {
  constructor(message = MESSAGES.ERRORS.SUBSCRIPTION_DELETE_FAILED) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
