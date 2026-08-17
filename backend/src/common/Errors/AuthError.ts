import { HttpStatus } from "../constant/httpStatus";
import { MESSAGES } from "../constant/messages";
import { AppError } from "./AppError";

export class UserAlreadyExist extends AppError {
  constructor(message = MESSAGES.ERRORS.USER_ALREADY_EXISTS) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidOtpError extends AppError {
  constructor(message = MESSAGES.ERRORS.INVALID_OTP) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
export class UserNotFound extends AppError {
  constructor(message = MESSAGES.ERRORS.USER_NOT_FOUND) {
    super(message, HttpStatus.NOT_FOUND);
  }
}
export class PasswordMatchError extends AppError {
  constructor(message = MESSAGES.ERRORS.PASSWORD_MISMATCH) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
export class RefreshTokenNotFound extends AppError {
  constructor(message = MESSAGES.ERRORS.REFRESH_TOKEN_NOT_FOUND) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
export class InvalidToken extends AppError {
  constructor(message = MESSAGES.ERRORS.INVALID_TOKEN) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
export class InvalidRefreshToken extends AppError {
  constructor(message = MESSAGES.ERRORS.INVALID_REFRESH_TOKEN) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class AccessDeniedError extends AppError {
  constructor(message = MESSAGES.ERRORS.ACCESS_DENIED) {
    super(message, HttpStatus.FORBIDDEN);
  }
}

type ValidationError = {
  field: string;
  message: string;
};
export class ValidationFailedError extends AppError {
  constructor(
    message = MESSAGES.ERRORS.VALIDATION_FAILED,
    public readonly errors:ValidationError[],
  ) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class AccountDisabledError extends AppError {
    constructor() {
        super(
            MESSAGES.ERRORS.ACCOUNT_DISABLED,
            HttpStatus.FORBIDDEN
        );
    }
}
