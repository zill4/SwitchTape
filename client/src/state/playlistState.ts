import type { Playlist } from '../models/Playlist';
import type { SpotifyPlaylist } from '../models/SpotifyPlaylist';

interface PlaylistStateType {
  sourcePlaylist: Playlist | SpotifyPlaylist | null;
  sourcePlatform: 'spotify' | 'apple' | null;
  destinationPlatform: string | null;
}

class PlaylistStateManager {
  private state: PlaylistStateType = {
    sourcePlaylist: null,
    sourcePlatform: null,
    destinationPlatform: null
  };

  private listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  getSourcePlaylist(): Playlist | SpotifyPlaylist | null {
    return this.state.sourcePlaylist;
  }

  setSourcePlaylist(playlist: Playlist | SpotifyPlaylist) {
    this.state.sourcePlaylist = playlist;
    this.notify();
  }

  getSourcePlatform(): 'spotify' | 'apple' | null {
    return this.state.sourcePlatform;
  }

  setSourcePlatform(platform: 'spotify' | 'apple') {
    this.state.sourcePlatform = platform;
    this.notify();
  }

  setDestinationPlaylistId(id: string) {
    localStorage.setItem('destination_playlist_id', id);
  }

  getDestinationPlaylistId(): string | null {
    return localStorage.getItem('destination_playlist_id');
  }
}

export const PlaylistState = new PlaylistStateManager();