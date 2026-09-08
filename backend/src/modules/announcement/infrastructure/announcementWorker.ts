import { Worker } from "bullmq";
import Redis from "ioredis";
import { socketService } from "../../../socket/socketService.js";
import { SOCKET_EVENTS } from "../../../socket/socketEvents.js";
import logger from "../../../shared/utils/logger.js";

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
});

export const announcementWorker = new Worker(
  "announcement-queue",
  async (job) => {
    const { workspaceId } = job.data;

    if (job.name === "publish-announcement") {
      const { announcement } = job.data;
      socketService.emitToWorkspace(
        workspaceId,
        SOCKET_EVENTS.NEW_ANNOUNCEMENT,
        announcement
      );
      logger.info(
        `[Announcement Worker] Broadcasted new announcement to workspace:${workspaceId}`
      );
    } else if (job.name === "pin-announcement") {
      const { announcementId, isPinned } = job.data;
      socketService.emitToWorkspace(workspaceId, SOCKET_EVENTS.PIN_ANNOUNCEMENT, {
        announcementId,
        isPinned,
      });
      logger.info(
        `[Announcement Worker] Broadcasted pin update for ${announcementId}`
      );
    } else if (job.name === "delete-announcement") {
      const { announcementId } = job.data;
      socketService.emitToWorkspace(
        workspaceId,
        SOCKET_EVENTS.DELETE_ANNOUNCEMENT,
        { announcementId }
      );
      logger.info(
        `[Announcement Worker] Broadcasted delete for ${announcementId}`
      );
    }
  },
  {
    connection: redisConnection,
  }
);

announcementWorker.on("failed", (job, err) => {
  logger.error(
    `[Announcement Worker] Job ${job?.id} failed: ${err.message}`
  );
});
