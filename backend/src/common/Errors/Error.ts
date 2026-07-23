import { HttpStatus } from "../constant/HttpStatus";
import { MESSAGES } from "../constant/messages";

class AppError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class UserAlreadyExist extends AppError {
  constructor(message = MESSAGES.ERRORS.USER_ALREADY_EXISTS) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidOtpError extends AppError {
  constructor(message = MESSAGES.ERRORS.INVALID_OTP) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
export class UserNotFound extends AppError {
  constructor(message = MESSAGES.ERRORS.USER_NOT_FOUND) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
export class PasswordMatchError extends AppError {
  constructor(message = MESSAGES.ERRORS.PASSWORD_MISMATCH) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
export class RefreshTokenNotFound extends AppError {
  constructor(message = MESSAGES.ERRORS.REFRESH_TOKEN_NOT_FOUND) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
export class InvalidRefreshToken extends AppError {
  constructor(message = MESSAGES.ERRORS.INVALID_REFRESH_TOKEN) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}


