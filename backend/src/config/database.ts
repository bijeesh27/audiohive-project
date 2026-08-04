import dotenv from "dotenv";
import mongoose from "mongoose";
import logger from "../shared/utils/logger";
dotenv.config();
const MONGO_URI: string = process.env.MONGO_URI!;

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('database connected')
  } catch (error) {
    logger.error(`database connection error ${error}`)
  }
};
