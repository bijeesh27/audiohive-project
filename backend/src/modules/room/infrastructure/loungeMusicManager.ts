import type { TrackItem } from "../domain/IAudioSourceService.ts";
export type { TrackItem };
import { RoyaltyFreeAudioSource } from "./royaltyFreeAudioSource.ts";

export interface InternalPlaybackState {
  currentTrack: TrackItem | null;
  isPlaying: boolean;
  startedAt: number; // timestamp (ms) when playback started or resumed
  position: number; // position in seconds at startedAt
  updatedAt: number; // timestamp (ms) of last state update
  queue: TrackItem[];
  skipVotes: Set<string>; // set of userIds who voted to skip
}

export interface ClientPlaybackSnapshot {
  currentTrack: TrackItem | null;
  isPlaying: boolean;
  position: number; // current calculated position in seconds
  startedAt: number;
  serverTime: number; // current server timestamp for clock drift compensation
  queue: TrackItem[];
  skipVotesCount: number;
  skipVotesRequired: number;
  hasVotedSkip: boolean;
}

export class LoungeMusicManager {
  private static instance: LoungeMusicManager;
  private roomStates: Map<string, InternalPlaybackState> = new Map();
  private audioSource = new RoyaltyFreeAudioSource();

  private constructor() {}

  public static getInstance(): LoungeMusicManager {
    if (!LoungeMusicManager.instance) {
      LoungeMusicManager.instance = new LoungeMusicManager();
    }
    return LoungeMusicManager.instance;
  }

  private getOrCreateState(roomId: string): InternalPlaybackState {
    if (!this.roomStates.has(roomId)) {
      this.roomStates.set(roomId, {
        currentTrack: null,
        isPlaying: false,
        startedAt: Date.now(),
        position: 0,
        updatedAt: Date.now(),
        queue: [],
        skipVotes: new Set<string>(),
      });
    }
    return this.roomStates.get(roomId)!;
  }

  /**
   * Computes the current playback position based on the server time elapsed.
   * Handles auto-advancing to the next track if duration has elapsed.
   */
  public computeCurrentPosition(state: InternalPlaybackState): number {
    if (!state.currentTrack) return 0;
    if (!state.isPlaying) return Math.min(state.position, state.currentTrack.duration);

    const elapsedSeconds = (Date.now() - state.startedAt) / 1000;
    const computed = state.position + elapsedSeconds;

    if (computed >= state.currentTrack.duration) {
      // Current track finished, advance to next track in queue
      this.advanceNextTrack(state);
      return 0;
    }

    return Math.max(0, Math.min(computed, state.currentTrack.duration));
  }

  private advanceNextTrack(state: InternalPlaybackState): void {
    state.skipVotes.clear();
    if (state.queue.length > 0) {
      const nextTrack = state.queue.shift()!;
      state.currentTrack = nextTrack;
      state.isPlaying = true;
      state.position = 0;
      state.startedAt = Date.now();
      state.updatedAt = Date.now();
    } else {
      state.currentTrack = null;
      state.isPlaying = false;
      state.position = 0;
      state.startedAt = Date.now();
      state.updatedAt = Date.now();
    }
  }

  public getSnapshot(roomId: string, userId?: string, activeListenerCount: number = 1): ClientPlaybackSnapshot {
    const state = this.getOrCreateState(roomId);
    const position = this.computeCurrentPosition(state);
    const requiredVotes = Math.max(1, Math.ceil(Math.max(1, activeListenerCount) / 2));

    return {
      currentTrack: state.currentTrack,
      isPlaying: state.isPlaying,
      position,
      startedAt: state.startedAt,
      serverTime: Date.now(),
      queue: [...state.queue],
      skipVotesCount: state.skipVotes.size,
      skipVotesRequired: requiredVotes,
      hasVotedSkip: userId ? state.skipVotes.has(userId) : false,
    };
  }

  public play(roomId: string): ClientPlaybackSnapshot {
    const state = this.getOrCreateState(roomId);
    if (!state.currentTrack) {
      if (state.queue.length > 0) {
        this.advanceNextTrack(state);
      }
      return this.getSnapshot(roomId);
    }

    if (!state.isPlaying) {
      state.isPlaying = true;
      state.startedAt = Date.now();
      state.updatedAt = Date.now();
    }
    return this.getSnapshot(roomId);
  }

  public pause(roomId: string): ClientPlaybackSnapshot {
    const state = this.getOrCreateState(roomId);
    if (!state.currentTrack) return this.getSnapshot(roomId);

    if (state.isPlaying) {
      state.position = this.computeCurrentPosition(state);
      state.isPlaying = false;
      state.startedAt = Date.now();
      state.updatedAt = Date.now();
    }
    return this.getSnapshot(roomId);
  }

  public seek(roomId: string, targetPosition: number): ClientPlaybackSnapshot {
    const state = this.getOrCreateState(roomId);
    if (!state.currentTrack) return this.getSnapshot(roomId);

    const clampedPosition = Math.max(0, Math.min(targetPosition, state.currentTrack.duration));
    state.position = clampedPosition;
    state.startedAt = Date.now();
    state.updatedAt = Date.now();

    return this.getSnapshot(roomId);
  }

  public addToQueue(roomId: string, track: TrackItem, addedBy?: { userId: string; username: string }): ClientPlaybackSnapshot {
    const state = this.getOrCreateState(roomId);
    const trackWithUser: TrackItem = {
      ...track,
      addedBy: addedBy || track.addedBy,
    };

    if (!state.currentTrack && !state.isPlaying) {
      state.currentTrack = trackWithUser;
      state.isPlaying = true;
      state.position = 0;
      state.startedAt = Date.now();
      state.updatedAt = Date.now();
      state.skipVotes.clear();
    } else {
      state.queue.push(trackWithUser);
      state.updatedAt = Date.now();
    }

    return this.getSnapshot(roomId);
  }

  public voteSkip(roomId: string, userId: string, activeListenerCount: number = 1): { snapshot: ClientPlaybackSnapshot; skipped: boolean } {
    const state = this.getOrCreateState(roomId);
    if (!state.currentTrack) {
      return { snapshot: this.getSnapshot(roomId, userId, activeListenerCount), skipped: false };
    }

    state.skipVotes.add(userId);
    const requiredVotes = Math.max(1, Math.ceil(Math.max(1, activeListenerCount) / 2));

    let skipped = false;
    if (state.skipVotes.size >= requiredVotes) {
      this.advanceNextTrack(state);
      skipped = true;
    }

    return {
      snapshot: this.getSnapshot(roomId, userId, activeListenerCount),
      skipped,
    };
  }

  public adminSkip(roomId: string): ClientPlaybackSnapshot {
    const state = this.getOrCreateState(roomId);
    this.advanceNextTrack(state);
    return this.getSnapshot(roomId);
  }

  public async getAudioLibrary(): Promise<TrackItem[]> {
    return this.audioSource.getLibrary();
  }

  public async searchAudioLibrary(query: string): Promise<TrackItem[]> {
    return this.audioSource.searchTracks(query);
  }
}

export const loungeMusicManager = LoungeMusicManager.getInstance();

