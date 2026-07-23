import { Response } from "express";
import { HttpStatus } from "../constant/HttpStatus";

export class ApiResposne {
  static success(
    res: Response,
    message: string,
    data?: unknown,
    statusCode=HttpStatus.OK,
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }
}
