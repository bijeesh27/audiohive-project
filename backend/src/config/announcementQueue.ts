import { Queue } from "bullmq";
import Redis from "ioredis";

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
});

export const announcementQueue = new Queue("announcement-queue", {
  connection: redisConnection,
});
