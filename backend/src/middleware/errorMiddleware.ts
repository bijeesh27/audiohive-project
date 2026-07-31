import { NextFunction, Request, Response } from "express";

export const globelErrorHandler = (
  err: Error&{statusCode:number},
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const message = err.message || "Internal Server Error";
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    status: statusCode,
    message: message,
  });
};
