import type { Playlist } from '../models/Playlist';
import type { SpotifyPlaylist } from '../models/SpotifyPlaylist';

interface PlaylistStateType {
  sourcePlaylist: Playlist | SpotifyPlaylist | null;
  destinationPlatform: string | null;
}

class PlaylistStateManager {
  private state: PlaylistStateType = {
    sourcePlaylist: null,
    destinationPlatform: null
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    // Try to load state from localStorage
    const savedState = localStorage.getItem('playlistState');
    if (savedState) {
      this.state = JSON.parse(savedState);
    }
  }

  private notify() {
    // Notify all listeners of state change
    this.listeners.forEach(listener => listener());
    // Save to localStorage
    localStorage.setItem('playlistState', JSON.stringify(this.state));
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): PlaylistStateType {
    return this.state;
  }

  getSourcePlaylist(): Playlist | SpotifyPlaylist | null {
    return this.state.sourcePlaylist;
  }

  setSourcePlaylist(playlist: Playlist | SpotifyPlaylist) {
    this.state.sourcePlaylist = playlist;
    this.notify();
  }

  setDestination(platform: string) {
    this.state.destinationPlatform = platform;
    this.notify();
  }

  clearState() {
    this.state = {
      sourcePlaylist: null,
      destinationPlatform: null
    };
    this.notify();
    localStorage.removeItem('playlistState');
  }
}

// Create a singleton instance
export const PlaylistState = new PlaylistStateManager();