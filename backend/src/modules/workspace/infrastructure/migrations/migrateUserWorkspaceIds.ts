import dotenv from "dotenv";
import mongoose from "mongoose";
import { UserModel } from "../../../../shared/User.utils/userSchema.ts";
import { getUserWorkspaceIds } from "../../../../shared/User.utils/workspaceMembership.ts";

dotenv.config();

async function migrateUserWorkspaceIds() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is required to run this migration");

  await mongoose.connect(mongoUri);
  let migrated = 0;
  const cursor = UserModel.find({ workspaceId: { $exists: true, $ne: null } })
    .select("workspaceIds workspaceId")
    .cursor();

  for await (const user of cursor) {
    const workspaceIds = getUserWorkspaceIds(user);
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: { workspaceIds },
        $unset: { workspaceId: 1 },
      },
    );
    migrated += 1;
  }

  console.info(`Migrated ${migrated} user workspace assignments`);
  await mongoose.disconnect();
}

migrateUserWorkspaceIds().catch(async (error: unknown) => {
  console.error("Workspace membership migration failed", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
