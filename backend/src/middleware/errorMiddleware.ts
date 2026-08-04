import { NextFunction, Request, Response } from "express";

export const globelErrorHandler = (
  err: Error&{statusCode:number,errors?: unknown},
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const message = err.message || "Internal Server Error";
  const statusCode = err.statusCode || 500;
  const error=err.errors||'No error data'
  return res.status(statusCode).json({
    status: statusCode,
    message: message,
    errors: error,
  });
};
