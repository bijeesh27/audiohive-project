import crypto from "crypto";

export const generateOtp = (length: number = 4): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return crypto.randomInt(min, max).toString();
};
