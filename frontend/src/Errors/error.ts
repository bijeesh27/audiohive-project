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