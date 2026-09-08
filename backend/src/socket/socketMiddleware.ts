import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../middleware/authMiddleware.js";
import logger from "../shared/utils/logger.js";

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    logger.warn("[Socket] Connection rejected — no token provided");
    return next(new Error("Authentication error: no token"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    socket.data.user = decoded;
    next();
  } catch {
    logger.warn("[Socket] Connection rejected — invalid token");
    next(new Error("Authentication error: invalid token"));
  }
}
