import { connectApp } from "./app.ts";
import { connectDB } from "./config/database.ts";
import "./modules/superAdmin/infrastructure/emailWorker.ts"; 

connectDB();
connectApp();
