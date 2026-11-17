import { IAudioSourceService, TrackItem } from "../domain/IAudioSourceService.ts";

export class RoyaltyFreeAudioSource implements IAudioSourceService {
  private static readonly TRACKS: TrackItem[] = [
    {
      id: "rf-1",
      title: "Lofi Study Session",
      artist: "AudioHive Chill Collective",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: 372,
      coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80",
    },
    {
      id: "rf-2",
      title: "Coffee & Code Ambient",
      artist: "DevFlow Beats",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      duration: 423,
      coverUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80",
    },
    {
      id: "rf-3",
      title: "Sunset Serenade",
      artist: "Acoustic Horizon",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      duration: 345,
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80",
    },
    {
      id: "rf-4",
      title: "Deep Focus Flow",
      artist: "Neural Beats",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      duration: 302,
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80",
    },
  ];

  async getLibrary(): Promise<TrackItem[]> {
    return RoyaltyFreeAudioSource.TRACKS;
  }

  async searchTracks(query: string): Promise<TrackItem[]> {
    const q = query.toLowerCase().trim();
    if (!q) return RoyaltyFreeAudioSource.TRACKS;
    return RoyaltyFreeAudioSource.TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }

  async getTrackById(id: string): Promise<TrackItem | null> {
    return RoyaltyFreeAudioSource.TRACKS.find((t) => t.id === id) || null;
  }
}

