import { Playlist } from "../models/Playlist";
import type { SpotifyPlaylist } from "../models/SpotifyPlaylist";
export interface PlaylistStateManager {
    sourcePlaylist: Playlist | null | SpotifyPlaylist;
    selectedDestination: string | null;
}

class PlaylistStateManagerClass {
    private state = {
        sourcePlaylist: null as Playlist | null | SpotifyPlaylist,
        selectedDestination: null as string | null,
    };

    setSourcePlaylist(playlist: Playlist | SpotifyPlaylist) {
        this.state.sourcePlaylist = playlist;
        this.saveToStorage();
    }

    getSourcePlaylist(): Playlist | null | SpotifyPlaylist {
        this.loadFromStorage();
        return this.state.sourcePlaylist;
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
            sourcePlaylist: null,
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