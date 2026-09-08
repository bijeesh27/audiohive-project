import { connectApp } from "./app.ts";
import { connectDB } from "./config/database.ts";
import "./shared/utils/emailWorker.ts"; 
import "./modules/announcement/infrastructure/announcementWorker.ts";

connectDB();
connectApp();
