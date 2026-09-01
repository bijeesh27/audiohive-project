import { connectApp } from "./app.ts";
import { connectDB } from "./config/database.ts";
import "./shared/utils/emailWorker.ts"; 

connectDB();
connectApp();
