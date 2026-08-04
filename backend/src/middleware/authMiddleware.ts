import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AccessDeniedError, InvalidToken } from "../common/Errors/Error";

export interface TokenPayload {
  id: string;
  username: string;
  userEmail: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new InvalidToken());
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    next(new InvalidToken());
  }
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AccessDeniedError());
    }
    next();
  };
}