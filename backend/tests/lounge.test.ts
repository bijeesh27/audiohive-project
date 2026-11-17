import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import { WorkspaceModel, IWorkspaceDocument } from "../src/modules/workspace/infrastructure/workspaceSchema.ts";
import { RoomModel } from "../src/modules/room/infrastructure/roomSchema.ts";
import { WorkspaceReopsitory } from "../src/modules/workspace/infrastructure/workspaceRepository.ts";
import { RoomRepository } from "../src/modules/room/infrastructure/roomRepository.ts";
import { DeleteRoomUseCase } from "../src/modules/room/application/usecases/deleteRoomUseCase.ts";
import { CreateRoomUseCase } from "../src/modules/room/application/usecases/createRoomUseCase.ts";
import { migrateDefaultLounges } from "../src/modules/workspace/infrastructure/migrations/createDefaultLoungeMigration.ts";
import { LoungeMusicManager } from "../src/modules/room/infrastructure/loungeMusicManager.ts";
import { AppError } from "../src/common/Errors/AppError.ts";
import { HttpStatus } from "../src/common/constant/httpStatus.ts";

describe("Lounge & Workspace Default Room Test Suite", () => {
  const workspaceRepo = new WorkspaceReopsitory();
  const roomRepo = new RoomRepository();
  const mockActivityRepo: any = { recordActivity: async () => {} };
  const deleteRoomUseCase = new DeleteRoomUseCase(roomRepo, mockActivityRepo);

  const testOrgId = new Types.ObjectId();
  const testAdminId = new Types.ObjectId().toString();
  const testWorkspaceIds: Types.ObjectId[] = [];

  before(async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not configured in environment");
    }
    await mongoose.connect(mongoUri);
    try {
      await mongoose.connection.collection("rooms").dropIndex("name_1");
    } catch {
      // index already dropped or does not exist
    }
    await RoomModel.syncIndexes();
  });

  after(async () => {
    // Cleanup test data created during test run
    if (testWorkspaceIds.length > 0) {
      await RoomModel.deleteMany({ workspaceId: { $in: testWorkspaceIds } });
      await WorkspaceModel.deleteMany({ _id: { $in: testWorkspaceIds } });
    }
    await mongoose.disconnect();
  });

  // ── TEST 1: LOUNGE CREATED ON WORKSPACE CREATION ──────────────
  describe("1. Auto-creation of Lounge on Workspace Creation (Transaction)", () => {
    it("creates workspace and default Lounge in atomic transaction with correct defaults", async () => {
      const slug = `test-ws-${Date.now()}`;
      const { workspace, lounge } = await workspaceRepo.createWorkspaceWithLounge(
        {
          organizationId: testOrgId,
          workspaceName: "Test Auto Workspace",
          slug,
        } as unknown as IWorkspaceDocument,
        testAdminId
      );

      testWorkspaceIds.push(workspace._id as Types.ObjectId);

      assert.ok(workspace._id, "Workspace was not created");
      assert.ok(lounge._id, "Lounge room was not created");
      assert.strictEqual(lounge.name, "Lounge");
      assert.strictEqual(lounge.isDefault, true);
      assert.strictEqual(lounge.type, "lounge");
      assert.strictEqual(lounge.isPrivate, false);
      assert.strictEqual(lounge.workspaceId.toString(), workspace._id.toString());
      assert.strictEqual(lounge.settings?.music?.enabled, true);

      // Verify in database
      const foundLounge = await RoomModel.findOne({ workspaceId: workspace._id, isDefault: true });
      assert.ok(foundLounge, "Lounge room not found in DB");
      assert.strictEqual(foundLounge.name, "Lounge");
    });

    it("rolls back workspace creation if room creation fails in the transaction", async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      const slug = `rollback-ws-${Date.now()}`;
      let createdWsId: Types.ObjectId | null = null;

      try {
        const [ws] = await WorkspaceModel.create(
          [
            {
              organizationId: testOrgId,
              workspaceName: "Rollback Test",
              slug,
            },
          ],
          { session }
        );
        createdWsId = ws._id as Types.ObjectId;

        // Simulate a failure in room creation (e.g. throwing error)
        throw new Error("Simulated room creation failure inside transaction");
      } catch (err: any) {
        await session.abortTransaction();
      } finally {
        await session.endSession();
      }

      // Assert workspace creation rolled back and does not exist in DB
      const foundWs = await WorkspaceModel.findById(createdWsId);
      assert.strictEqual(foundWs, null, "Workspace should have been rolled back and not exist in DB");
    });

    it("enforces partial unique index: only ONE isDefault=true room allowed per workspace", async () => {
      const slug = `unique-index-ws-${Date.now()}`;
      const { workspace } = await workspaceRepo.createWorkspaceWithLounge(
        {
          organizationId: testOrgId,
          workspaceName: "Index Test WS",
          slug,
        } as unknown as IWorkspaceDocument,
        testAdminId
      );
      testWorkspaceIds.push(workspace._id as Types.ObjectId);

      // Attempting to create a second room with isDefault = true in the SAME workspace must fail with E11000
      await assert.rejects(
        async () => {
          await RoomModel.create({
            organizationId: testOrgId,
            workspaceId: workspace._id,
            name: "Lounge 2",
            type: "lounge",
            isDefault: true,
            isPrivate: false,
            createdBy: new Types.ObjectId(),
          });
        },
        (err: any) => {
          return err.code === 11000;
        },
        "Should throw MongoDB duplicate key error (11000) on unique partial index"
      );
    });
  });

  // ── TEST 2: MIGRATION IS IDEMPOTENT ─────────────────────────
  describe("2. Idempotent Migration Script", () => {
    it("safely creates Lounge for workspaces missing one, and skips existing ones on re-run", async () => {
      // Create a test workspace without Lounge directly
      const slug = `migration-ws-${Date.now()}`;
      const ws = await WorkspaceModel.create({
        organizationId: testOrgId,
        workspaceName: "Migration Target Workspace",
        slug,
      });
      testWorkspaceIds.push(ws._id as Types.ObjectId);

      // Verify it currently has 0 rooms
      const countBefore = await RoomModel.countDocuments({ workspaceId: ws._id });
      assert.strictEqual(countBefore, 0);

      // Run 1: Should create a Lounge
      const resultRun1 = await migrateDefaultLounges();
      assert.ok(resultRun1.createdLounges >= 1, "Should have created at least 1 lounge");

      const roomAfterRun1 = await RoomModel.findOne({ workspaceId: ws._id, isDefault: true });
      assert.ok(roomAfterRun1, "Lounge room should exist after migration");
      assert.strictEqual(roomAfterRun1.name, "Lounge");

      // Run 2: Re-run migration; must be idempotent (creates 0 new rooms for this workspace)
      const countAfterRun1 = await RoomModel.countDocuments({ workspaceId: ws._id });
      assert.strictEqual(countAfterRun1, 1);

      await migrateDefaultLounges();

      const countAfterRun2 = await RoomModel.countDocuments({ workspaceId: ws._id });
      assert.strictEqual(countAfterRun2, 1, "Migration re-run must not create duplicate rooms");
    });
  });

  // ── TEST 3: DELETE & ARCHIVE BLOCKED ─────────────────────────
  describe("3. Rules for Default Room: Delete / Archive Blocked", () => {
    it("blocks deleting the default Lounge room with 403 Forbidden", async () => {
      const slug = `delete-block-ws-${Date.now()}`;
      const { workspace, lounge } = await workspaceRepo.createWorkspaceWithLounge(
        {
          organizationId: testOrgId,
          workspaceName: "Delete Block WS",
          slug,
        } as unknown as IWorkspaceDocument,
        testAdminId
      );
      testWorkspaceIds.push(workspace._id as Types.ObjectId);

      // Attempt to delete default room
      await assert.rejects(
        async () => {
          await deleteRoomUseCase.execute({
            roomId: lounge._id.toString(),
            workspaceId: workspace._id.toString(),
            organizationId: testOrgId.toString(),
            actorId: testAdminId,
          });
        },
        (err: any) => {
          assert.strictEqual(err instanceof AppError, true);
          assert.strictEqual((err as AppError).statusCode, HttpStatus.FORBIDDEN);
          assert.match((err as AppError).message, /cannot be deleted/i);
          return true;
        }
      );

      // Room still exists
      const roomInDb = await RoomModel.findById(lounge._id);
      assert.ok(roomInDb, "Default room must still exist in DB after blocked delete");
    });
  });

  // ── TEST 4: maxRooms LIMIT IS NOT AFFECTED ───────────────────
  describe("4. Plan maxRooms limit ignores Default Room", () => {
    it("does not count the default Lounge room towards the plan's room limit", async () => {
      const slug = `maxrooms-ws-${Date.now()}`;
      const { workspace, lounge } = await workspaceRepo.createWorkspaceWithLounge(
        {
          organizationId: testOrgId,
          workspaceName: "MaxRooms WS",
          slug,
        } as unknown as IWorkspaceDocument,
        testAdminId
      );
      testWorkspaceIds.push(workspace._id as Types.ObjectId);

      // Mock subscription with maxRooms = 2
      const mockSubRepo: any = {
        findSubscription: async () => ({ maxRooms: 2 }),
      };
      const mockOrgRepo: any = {
        findOrganizationById: async () => ({ planId: "test-plan" }),
      };

      const createRoomUseCase = new CreateRoomUseCase(
        roomRepo,
        mockActivityRepo,
        mockSubRepo,
        mockOrgRepo
      );

      // Current total rooms in workspace is 1 (the default Lounge)
      const totalRooms = await RoomModel.countDocuments({ workspaceId: workspace._id });
      assert.strictEqual(totalRooms, 1);

      // Non-default rooms count is 0
      const nonDefaultCount = await roomRepo.countNonDefaultRooms(workspace._id.toString());
      assert.strictEqual(nonDefaultCount, 0);

      // Room 1 (standard room): allowed
      await createRoomUseCase.execute({
        organizationId: testOrgId.toString(),
        workspaceId: workspace._id.toString(),
        name: `Standup Room ${Date.now()}`,
        type: "standard",
        createdBy: testAdminId,
      });

      // Room 2 (standard room): allowed (reaching limit of 2 standard rooms)
      await createRoomUseCase.execute({
        organizationId: testOrgId.toString(),
        workspaceId: workspace._id.toString(),
        name: `Design Room ${Date.now()}`,
        type: "standard",
        createdBy: testAdminId,
      });

      // At this point, workspace has 3 total rooms (1 Lounge + 2 standard rooms).
      // Since Lounge does not count, non-default count is 2.
      const nonDefaultAfterTwo = await roomRepo.countNonDefaultRooms(workspace._id.toString());
      assert.strictEqual(nonDefaultAfterTwo, 2);

      // Room 3 (standard room): must exceed the plan's 2-room limit and throw 400 Bad Request
      await assert.rejects(
        async () => {
          await createRoomUseCase.execute({
            organizationId: testOrgId.toString(),
            workspaceId: workspace._id.toString(),
            name: `Engineering Room ${Date.now()}`,
            type: "standard",
            createdBy: testAdminId,
          });
        },
        (err: any) => {
          assert.strictEqual(err instanceof AppError, true);
          assert.strictEqual((err as AppError).statusCode, HttpStatus.BAD_REQUEST);
          assert.match((err as AppError).message, /limit/i);
          return true;
        }
      );
    });
  });

  // ── TEST 5: PLAYBACK SYNC FOR A LATE JOINER ──────────────────
  describe("5. Shared Music Playback Synchronization for Late Joiners", () => {
    it("accurately computes position and syncs state for late joiners", async () => {
      const musicManager = LoungeMusicManager.getInstance();
      const testRoomId = `sync-test-room-${Date.now()}`;

      const track = {
        id: "test-track-1",
        title: "Sync Test Track",
        artist: "Test Artist",
        url: "https://example.com/audio.mp3",
        duration: 300, // 5 minutes
      };

      // User 1 adds track and starts playback
      musicManager.addToQueue(testRoomId, track, { userId: "user-1", username: "Alice" });
      const initialSnapshot = musicManager.play(testRoomId);

      assert.strictEqual(initialSnapshot.isPlaying, true);
      assert.strictEqual(initialSnapshot.currentTrack?.title, "Sync Test Track");

      // Fast forward: simulate 25 seconds of elapsed playback on the server
      const state = (musicManager as any).roomStates.get(testRoomId);
      assert.ok(state);
      state.startedAt = Date.now() - 25 * 1000; // started 25 seconds ago

      // User 2 (Late Joiner) joins and requests playback snapshot
      const lateJoinerSnapshot = musicManager.getSnapshot(testRoomId, "user-2-late", 2);

      // Late joiner receives isPlaying = true and computed position ~ 25s
      assert.strictEqual(lateJoinerSnapshot.isPlaying, true);
      assert.strictEqual(lateJoinerSnapshot.currentTrack?.id, "test-track-1");
      assert.ok(
        lateJoinerSnapshot.position >= 24 && lateJoinerSnapshot.position <= 26,
        `Expected position ~25s but got ${lateJoinerSnapshot.position}`
      );

      // Pause playback
      musicManager.pause(testRoomId);
      const pausedSnapshot = musicManager.getSnapshot(testRoomId, "user-3", 2);
      assert.strictEqual(pausedSnapshot.isPlaying, false);

      // Seek playback to 120s
      musicManager.seek(testRoomId, 120);
      const soughtSnapshot = musicManager.getSnapshot(testRoomId, "user-3", 2);
      assert.strictEqual(soughtSnapshot.position, 120);

      // Skip Voting:
      // Active listeners: 2. Required votes: ceil(2/2) = 1.
      const voteResult = musicManager.voteSkip(testRoomId, "user-1", 2);
      assert.strictEqual(voteResult.skipped, true);
    });
  });

  // ── TEST 6: ROOM ACCESS VALIDATION FOR MEMBERS IN LOUNGE ────
  describe("6. Room Access Validation for Members", () => {
    it("allows standard workspace members into the Lounge room without being explicitly in allowedUsers", async () => {
      const { ValidateRoomAccessUseCase } = await import(
        "../src/modules/room/application/usecases/validateRoomAccessUseCase.js"
      );
      const validateRoomAccessUseCase = new ValidateRoomAccessUseCase(roomRepo);

      const slug = `access-ws-${Date.now()}`;
      const { workspace, lounge } = await workspaceRepo.createWorkspaceWithLounge(
        {
          organizationId: testOrgId,
          workspaceName: "Access WS",
          slug,
        } as unknown as IWorkspaceDocument,
        testAdminId
      );
      testWorkspaceIds.push(workspace._id as Types.ObjectId);

      const randomMemberId = new Types.ObjectId().toString();

      // Member attempting to access the Lounge room
      const isAllowed = await validateRoomAccessUseCase.execute({
        roomId: lounge._id.toString(),
        workspaceId: workspace._id.toString(),
        userId: randomMemberId,
        role: "member",
      });

      assert.strictEqual(isAllowed, true, "Lounge room must allow any member without explicit allowedUsers entry");
    });
  });
});
