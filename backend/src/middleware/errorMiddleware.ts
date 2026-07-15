import { NextFunction, Request, Response } from "express";

export const globelErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const message = err.message;
  const statusCode = err.statusCode;
  return res.status(statusCode).json({
    status: statusCode,
    message: message,
  });
};
