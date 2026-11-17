import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, "../../../../../.env") });

async function runMigration() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is not set in environment.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);

  const roomsCollection = mongoose.connection.collection("rooms");

  const matchingRooms = await roomsCollection.find({ name: "Developement Room" }).toArray();
  console.log(`Found ${matchingRooms.length} room(s) with typo 'Developement Room'.`);

  if (matchingRooms.length > 0) {
    const result = await roomsCollection.updateMany(
      { name: "Developement Room" },
      { $set: { name: "Development Room", updatedAt: new Date() } }
    );
    console.log(`Updated ${result.modifiedCount} room(s) to 'Development Room'.`);
  } else {
    console.log("No rooms with typo found. Nothing to update.");
  }

  await mongoose.disconnect();
  console.log("Migration complete.");
}

// Export function so it can be called programmatically or directly
export { runMigration };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}

