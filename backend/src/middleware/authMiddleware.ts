import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiResposne } from "../common/Response/Response";
import { AccessDeniedError, InvalidToken } from "../common/Errors/Error";
export interface AuthRequest extends Request{
  user?:any
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new InvalidToken()
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decodedUser) => {
    if (err) {
      throw new InvalidToken()
    }

    req.user=decodedUser

    next();
  });
}


export function roleMiddleware(allowedRoles:string[]){
  return(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user || !allowedRoles.includes(req.user.role)){
      throw new AccessDeniedError()
    }
    next()
  }
}