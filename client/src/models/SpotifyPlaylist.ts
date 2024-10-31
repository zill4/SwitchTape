// Interfaces for nested structures
interface SpotifyImage {
    url: string;
    width: number;
    height: number;
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
}

interface SpotifyTrack {
    id: string;
    name: string;
    duration_ms: number;
    preview_url: string | null;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
    uri: string;
}

interface PlaylistTrackItem {
    added_at: string;
    track: SpotifyTrack;
}

export class SpotifyPlaylist {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly images: SpotifyImage[];
    readonly tracks: PlaylistTrackItem[];
    readonly uri: string;
    readonly totalTracks: number;

    constructor(playlistData: any) {
        this.id = playlistData.id;
        this.name = playlistData.name;
        this.description = playlistData.description;
        this.images = playlistData.images;
        this.uri = playlistData.uri;
        this.totalTracks = playlistData.tracks.total;
        this.tracks = this.processTrackItems(playlistData.tracks.items);
    }

    private processTrackItems(items: any[]): PlaylistTrackItem[] {
        return items.map(item => ({
            added_at: item.added_at,
            track: {
                id: item.track.id,
                name: item.track.name,
                duration_ms: item.track.duration_ms,
                preview_url: item.track.preview_url,
                uri: item.track.uri,
                artists: item.track.artists.map((artist: any) => ({
                    id: artist.id,
                    name: artist.name,
                    uri: artist.uri
                })),
                album: {
                    id: item.track.album.id,
                    name: item.track.album.name,
                    images: item.track.album.images,
                    release_date: item.track.album.release_date,
                    artists: item.track.album.artists.map((artist: any) => ({
                        id: artist.id,
                        name: artist.name,
                        uri: artist.uri
                    }))
                }
            }
        }));
    }

    // Utility methods
    getTrackCount(): number {
        return this.tracks.length;
    }

    getPlaylistDuration(): number {
        return this.tracks.reduce((total, item) => total + item.track.duration_ms, 0);
    }

    getArtists(): Set<string> {
        const artists = new Set<string>();
        this.tracks.forEach(item => {
            item.track.artists.forEach(artist => {
                artists.add(artist.name);
            });
        });
        return artists;
    }

    formatDuration(ms: number): string {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            images: this.images,
            tracks: this.tracks,
            uri: this.uri,
            totalTracks: this.totalTracks
        };
    }
}