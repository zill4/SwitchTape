import type { SpotifyPlaylist } from "./SpotifyPlaylist";

// Basic interfaces for the generic playlist
export interface GenericArtist {
    name: string;
    id?: string;
}

export interface GenericAlbum {
    name: string;
    id?: string;
}

export interface GenericTrack {
    name: string;
    artists: GenericArtist[];
    album: GenericAlbum;
    duration_ms: number;
    image?: string;
    id?: string;
}

export interface GenericImage {
    url: string;
    id?: string;
}

export class Playlist {
    name: string;
    description: string;
    tracks: GenericTrack[];
    totalTracks: number;
    image?: string;
    images?: GenericImage[];
    id?: string;
    platform: 'spotify' | 'apple' | undefined;
    constructor(name: string, description: string, tracks: GenericTrack[], image?: string, images?: GenericImage[], platform?: 'spotify' | 'apple') {
        this.name = name;
        this.description = description;
        this.tracks = tracks;
        this.totalTracks = tracks.length;
        this.image = image ?? '';
        this.images = images ?? [];
        this.platform = platform;
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
            spotifyPlaylist.images[0].url,
            spotifyPlaylist.images.map(image => ({ url: image.url })),
            'spotify'
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