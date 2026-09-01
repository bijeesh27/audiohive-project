import { HttpStatus } from "../constant/httpStatus";
import { MESSAGES } from "../constant/messages";
import { AppError } from "./AppError";


export class OrganizationNotFound extends AppError{
    constructor(message=MESSAGES.ERRORS.ORANIZATION_NOT_FOUND){
        super(message,HttpStatus.NOT_FOUND)
    }
}