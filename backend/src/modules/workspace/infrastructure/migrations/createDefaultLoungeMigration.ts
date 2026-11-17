import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import { WorkspaceModel } from "../workspaceSchema.ts";
import { RoomModel } from "../../../room/infrastructure/roomSchema.ts";
import logger from "../../../../shared/utils/logger.ts";

dotenv.config();

export interface MigrationResult {
  totalWorkspaces: number;
  createdLounges: number;
  skippedWorkspaces: number;
}

export async function migrateDefaultLounges(): Promise<MigrationResult> {
  try {
    await RoomModel.collection.dropIndex("name_1");
  } catch {
    // index already dropped or not present
  }
  await RoomModel.syncIndexes();

  const workspaces = await WorkspaceModel.find().lean();
  let createdCount = 0;
  let skippedCount = 0;

  for (const workspace of workspaces) {
    // Check if workspace already has a default room
    const existingDefault = await RoomModel.findOne({
      workspaceId: workspace._id,
      isDefault: true,
    });

    if (existingDefault) {
      skippedCount++;
      continue;
    }

    try {
      await RoomModel.create({
        organizationId: workspace.organizationId,
        workspaceId: workspace._id,
        name: "Lounge",
        description: "The workspace lounge - hang out, listen to music, and catch up with your team.",
        type: "lounge",
        isDefault: true,
        isPrivate: false,
        status: "active",
        capacity: 100,
        settings: {
          music: {
            enabled: true,
          },
        },
        allowedUsers: [],
        createdBy: new Types.ObjectId(),
      });

      // Ensure companyProfile is populated if empty
      if (!workspace.companyProfile?.name) {
        await WorkspaceModel.updateOne(
          { _id: workspace._id, "companyProfile.name": { $exists: false } },
          {
            $set: {
              companyProfile: {
                name: workspace.workspaceName,
                tagline: "Welcome to our virtual office",
                about: "Connect, collaborate, and listen to music together.",
                mission: "",
                website: "",
                logoUrl: "",
                links: [],
                announcements: [
                  {
                    title: "Welcome to the Lounge!",
                    body: "This is your team's social space. Hang out, share music, and stay connected.",
                    createdAt: new Date(),
                    createdBy: "AudioHive System",
                  },
                ],
              },
            },
          }
        );
      }

      createdCount++;
    } catch (err: any) {
      // If concurrent run created it (E11000 duplicate key on partial index)
      if (err?.code === 11000) {
        skippedCount++;
      } else {
        throw err;
      }
    }
  }

  logger.info(
    `[Migration] Completed: ${createdCount} lounges created, ${skippedCount} existing workspaces skipped out of ${workspaces.length} total.`
  );

  return {
    totalWorkspaces: workspaces.length,
    createdLounges: createdCount,
    skippedWorkspaces: skippedCount,
  };
}

// Standalone execution check
const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("createDefaultLoungeMigration.ts");
if (isMain) {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    logger.error("MONGO_URI is required to run migration");
    process.exit(1);
  }

  mongoose
    .connect(mongoUri)
    .then(async () => {
      logger.info("Connected to MongoDB for Lounge migration");
      const result = await migrateDefaultLounges();
      logger.info(`Lounge migration result: ${JSON.stringify(result)}`);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error("Lounge migration failed", err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
