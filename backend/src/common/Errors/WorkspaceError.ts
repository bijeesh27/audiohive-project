import { HttpStatus } from "../constant/httpStatus";
import { MESSAGES } from "../constant/messages";
import { AppError } from "./AppError";

export class CreateWorkspaceError extends AppError{
    constructor(message=MESSAGES.ERRORS.WORKSPACE_CREATION_FAILED){
        super(message,HttpStatus.BAD_REQUEST)
    }
}
export class InvitationError extends AppError{
    constructor(message=MESSAGES.ERRORS.INVALID_TOKEN){
        super(message,HttpStatus.BAD_REQUEST)
    }
}