import logger from "./logger.ts";

/**
 * Parses and sanitizes allowed origins from environment variables.
 * Supports CORS_ORIGIN and CLIENT_URL (comma-separated, with/without quotes, with/without trailing slashes).
 */
export const getAllowedOrigins = (): string[] => {
  const envOrigins = [process.env.CORS_ORIGIN, process.env.CLIENT_URL]
    .filter(Boolean)
    .flatMap((val) => val!.split(","))
    .map((origin) => origin.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, ""))
    .filter(Boolean);

  return envOrigins.length > 0
    ? Array.from(new Set(envOrigins))
    : ["http://localhost:5173"];
};

/**
 * Dynamic CORS origin validator for Express and Socket.IO.
 */
export const corsOriginChecker = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
  if (!origin) {
    return callback(null, true);
  }

  const allowedOrigins = getAllowedOrigins();

  // If wildcard is configured, allow all origins
  if (allowedOrigins.includes("*")) {
    return callback(null, true);
  }

  const normalizedOrigin = origin.trim().replace(/\/+$/, "");

  if (allowedOrigins.includes(normalizedOrigin)) {
    return callback(null, true);
  }

  logger.warn(
    `[CORS] Blocked request from origin: ${origin}. Allowed origins configured in env: [${allowedOrigins.join(", ")}]`
  );
  return callback(null, false);
};
