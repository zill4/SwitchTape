import type { Track, Playlist, Image, Artist, Album } from './music';

export class AppleMusicPlaylist implements Playlist {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly images: Image[];
    readonly tracks: Track[];
    readonly totalTracks: number;

    constructor(playlistData: any) {
        this.id = playlistData.id;
        this.name = playlistData.name;
        this.description = playlistData.description || '';
        this.images = this.processImages(playlistData.artwork);
        this.tracks = this.processTrackItems(playlistData.tracks);
        this.totalTracks = playlistData.tracks.length;
    }

    private processImages(artwork: any): Image[] {
        if (!artwork) return [];
        return [{
            url: artwork.url,
            width: artwork.width,
            height: artwork.height
        }];
    }

    private processTrackItems(items: any[]): Track[] {
        return items.map(item => ({
            id: item.id,
            name: item.name,
            durationMs: item.durationInMillis,
            artists: this.processArtists(item.artistName),
            album: this.processAlbum(item),
            previewUrl: item.previewURL
        }));
    }

    private processArtists(artistName: string): Artist[] {
        // Apple Music often provides artists as a single string
        return [{
            id: 'unknown',
            name: artistName
        }];
    }

    private processAlbum(track: any): Album {
        return {
            id: track.albumId,
            name: track.albumName,
            images: this.processImages(track.artwork),
            artists: this.processArtists(track.artistName),
            releaseDate: track.releaseDate
        };
    }

    // Utility methods similar to SpotifyPlaylist
    getTrackCount(): number {
        return this.tracks.length;
    }

    getPlaylistDuration(): number {
        return this.tracks.reduce((total, track) => total + track.durationMs, 0);
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
            totalTracks: this.totalTracks
        };
    }
}