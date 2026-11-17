export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number; // in seconds
  coverUrl?: string;
  addedBy?: {
    userId: string;
    username: string;
  };
}

export interface IAudioSourceService {
  getLibrary(): Promise<TrackItem[]>;
  searchTracks(query: string): Promise<TrackItem[]>;
  getTrackById(id: string): Promise<TrackItem | null>;
}

