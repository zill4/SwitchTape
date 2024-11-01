import type { SpotifyPlaylist } from "./SpotifyPlaylist";

// Basic interfaces for the generic playlist
export interface GenericArtist {
    name: string;
}

export interface GenericAlbum {
    name: string;
}

export interface GenericTrack {
    name: string;
    artists: GenericArtist[];
    album: GenericAlbum;
    duration_ms: number;
    image?: string;
}

export class Playlist {
    name: string;
    description: string;
    tracks: GenericTrack[];
    totalTracks: number;
    image?: string;

    constructor(name: string, description: string, tracks: GenericTrack[], image?: string) {
        this.name = name;
        this.description = description;
        this.tracks = tracks;
        this.totalTracks = tracks.length;
        this.image = image ?? '';
    }

    // Static method to convert from SpotifyPlaylist
    static fromSpotifyPlaylist(spotifyPlaylist: SpotifyPlaylist): Playlist {
        const tracks: GenericTrack[] = spotifyPlaylist.tracks.map(track => ({
            name: track.name,
            artists: track.artists.map(artist => ({ name: artist.name })),
            album: { name: track.album.name },
            duration_ms: track.duration_ms,
            image: track.image
        }));

        return new Playlist(
            spotifyPlaylist.name,
            spotifyPlaylist.description,
            tracks,
            spotifyPlaylist.images[0].url
        );
    }

    // Helper method to get formatted duration for a track
    getFormattedDuration(track: GenericTrack): string {
        const minutes = Math.floor(track.duration_ms / 60000);
        const seconds = Math.floor((track.duration_ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Helper method to get artist names as a string
    getArtistNames(track: GenericTrack): string {
        return track.artists.map(artist => artist.name).join(', ');
    }
}