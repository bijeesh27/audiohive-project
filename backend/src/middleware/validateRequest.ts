import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationFailedError } from "../common/Errors/Error";
import { MESSAGES } from "../common/constant/messages";

export const validateRequest =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
       return next(
    new ValidationFailedError(
      MESSAGES.ERRORS.VALIDATION_FAILED,
      error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }))
    )
  );
      }

      next(error);
    }
  };