class AppError extends Error {
  constructor(message: string,) {
    super(message);
  }
}

export class ContextError extends AppError{
    constructor(message:string){
        super(message)
    }
}
export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}
