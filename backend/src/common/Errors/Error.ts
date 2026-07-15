class AppError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class UserAlreadyExist extends AppError {
  constructor(message = "User already Exist") {
    super(message, 400);
  }
}

export class InvalidOtpError extends AppError {
  constructor(message = "Invalid Otp") {
    super(message, 401);
  }
}
export class UserNotFound extends AppError {
  constructor(message = "user Not found") {
    super(message, 401);
  }
}
export class PasswordMatchError extends AppError {
  constructor(message = "password doesnot match") {
    super(message, 401);
  }
}
