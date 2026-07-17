import { connectApp } from "./app.ts";
import { connectDB } from "./config/database.ts";

connectDB();
connectApp();
