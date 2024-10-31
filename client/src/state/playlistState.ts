import type { SpotifyPlaylist } from "../models/SpotifyPlaylist";

export interface PlaylistStateManager {
    playlist: SpotifyPlaylist | null;
    selectedDestination: string | null;
}

class PlaylistStateManagerClass {
    private state: PlaylistStateManager = {
        playlist: null,
        selectedDestination: null
    };

    setPlaylist(playlist: SpotifyPlaylist) {
        this.state.playlist = playlist;
        this.saveToStorage();
    }

    setDestination(platform: string) {
        this.state.selectedDestination = platform;
        this.saveToStorage();
    }

    getState(): PlaylistStateManager {
        this.loadFromStorage();
        return this.state;
    }

    clearState() {
        this.state = {
            playlist: null,
            selectedDestination: null
        };
        localStorage.removeItem('playlistState');
    }

    private saveToStorage() {
        localStorage.setItem('playlistState', JSON.stringify(this.state));
    }

    private loadFromStorage() {
        const stored = localStorage.getItem('playlistState');
        if (stored) {
            this.state = JSON.parse(stored);
        }
    }
}

export const PlaylistState = new PlaylistStateManagerClass();