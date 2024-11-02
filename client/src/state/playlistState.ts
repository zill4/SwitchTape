import type { AppleMusicPlaylist } from '../models/AppleMusicPlaylist';
import type { Playlist } from '../models/Playlist';
import type { SpotifyPlaylist } from '../models/SpotifyPlaylist';

interface PlaylistStateType {
  sourcePlaylist: Playlist | SpotifyPlaylist | AppleMusicPlaylist | null;
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

  constructor() {
    // Load state from localStorage on initialization
    const savedState = localStorage.getItem('playlistState');
    if (savedState) {
      this.state = JSON.parse(savedState);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
    // Save state to localStorage whenever it changes
    localStorage.setItem('playlistState', JSON.stringify(this.state));
  }

  getSourcePlaylist(): Playlist | SpotifyPlaylist | AppleMusicPlaylist | null {
    return this.state.sourcePlaylist;
  }

  setSourcePlaylist(playlist: Playlist | SpotifyPlaylist | AppleMusicPlaylist) {
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

let instance: PlaylistStateManager | null = null;

export const PlaylistState = (() => {
  if (!instance) {
    instance = new PlaylistStateManager();
  }
  return instance;
})();