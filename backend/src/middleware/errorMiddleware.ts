import { NextFunction, Request, Response } from "express";

export const globelErrorHandler = (
  err: Error&{statusCode:number},
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
