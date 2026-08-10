import { HttpStatus } from "../constant/httpStatus";
import { MESSAGES } from "../constant/messages";

class AppError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}


export class CreateWorkspaceError extends AppError{
    constructor(message=MESSAGES.ERRORS.WORKSPACE_CREATION_FAILED){
        super(message,HttpStatus.BAD_REQUEST)
    }
}