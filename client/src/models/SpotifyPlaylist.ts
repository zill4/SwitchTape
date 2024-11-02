// Interfaces to type the Spotify API response
interface SpotifyImage {
    url: string;
    height: number | null;
    width: number | null;
}

interface SpotifyArtist {
    id: string;
    name: string;
    uri: string;
}

interface SpotifyAlbum {
    id: string;
    name: string;
    images: SpotifyImage[];
    release_date: string;
    artists: SpotifyArtist[];
    total_tracks: number;
}

interface SpotifyTrackData {
    id: string;
    name: string;
    duration_ms: number;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
    uri: string;
    preview_url: string | null;
    is_local: boolean;
}

interface SpotifyTrackItem {
    added_at: string;
    track: SpotifyTrackData;
}

interface SpotifyPlaylistData {
    id: string;
    name: string;
    description: string;
    images: SpotifyImage[];
    tracks: {
        items: SpotifyTrackItem[];
        total: number;
    };
    uri: string;
}

// Main classes to handle the data
export class SpotifyPlaylist {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly images: SpotifyImage[];
    readonly tracks: SpotifyTrack[];
    readonly uri: string;
    readonly totalTracks: number;
    readonly platform: 'spotify';
    constructor(playlistData: SpotifyPlaylistData) {
        this.id = playlistData.id;
        this.name = playlistData.name;
        this.description = playlistData.description;
        this.images = playlistData.images;
        this.uri = playlistData.uri;
        this.totalTracks = playlistData.tracks.total;
        this.tracks = this.processTracks(playlistData.tracks.items);
        this.platform = 'spotify';
    }

    private processTracks(items: SpotifyTrackItem[]): SpotifyTrack[] {
        return items
            .filter(item => item.track) // Ensure track exists
            .map(item => new SpotifyTrack(item));
    }

    // Helper method to get the best quality image URL
    getBestImageUrl(): string | undefined {
        if (!this.images.length) return undefined;
        
        // Sort by width (descending) and take the first one
        const sortedImages = [...this.images].sort((a, b) => 
            (b.width || 0) - (a.width || 0)
        );
        return sortedImages[0].url;
    }
}

export class SpotifyTrack {
    readonly id: string;
    readonly name: string;
    readonly artists: SpotifyArtist[];
    readonly album: SpotifyAlbum;
    readonly duration_ms: number;
    readonly uri: string;
    readonly preview_url: string | null;
    readonly added_at: string;
    readonly is_local: boolean;
    readonly image: string | undefined;

    constructor(trackItem: SpotifyTrackItem) {
        const track = trackItem.track;
        this.id = track.id;
        this.name = track.name;
        this.artists = track.artists;
        this.album = track.album;
        this.duration_ms = track.duration_ms;
        this.uri = track.uri;
        this.preview_url = track.preview_url;
        this.added_at = trackItem.added_at;
        this.is_local = track.is_local;
        this.image = track.album.images[0].url;
    }

    // Helper methods
    getArtistNames(): string {
        return this.artists.map(artist => artist.name).join(', ');
    }

    getBestAlbumImageUrl(): string | undefined {
        if (!this.album.images.length) return undefined;
        
        // Sort by width (descending) and take the first one
        const sortedImages = [...this.album.images].sort((a, b) => 
            (b.width || 0) - (a.width || 0)
        );
        return sortedImages[0].url;
    }

    // Format duration as mm:ss
    getFormattedDuration(): string {
        const minutes = Math.floor(this.duration_ms / 60000);
        const seconds = Math.floor((this.duration_ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}