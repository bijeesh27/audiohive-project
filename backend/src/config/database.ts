import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
const MONGO_URI: string = process.env.MONGO_URI!;

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("database connected");
  } catch (error) {
    console.log("database connection error", error);
  }
};
