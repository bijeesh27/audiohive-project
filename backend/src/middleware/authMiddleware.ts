import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new Error("invalid token");
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ msg: "invalid token" });
    }

    // req.user=decodedUser

    next();
  });
}
