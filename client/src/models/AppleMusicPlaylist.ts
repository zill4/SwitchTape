import { Playlist, type GenericTrack, type GenericArtist } from "./Playlist";

export class AppleMusicPlaylist extends Playlist {
    constructor(playlistData: any) {
        // Get the first item since Apple returns an array in data[0]
        const data = playlistData.data[0];
        
        super(
            data.attributes.name,
            data.attributes.description?.standard || '',
            []  // Initialize with empty tracks array, will be filled in processTracks
        );

        this.tracks = this.processTracks(data.relationships.tracks.data);
        
        // Add artwork if available
        if (data.attributes.artwork?.url) {
            this.images = [{
                url: data.attributes.artwork.url.replace('{w}x{h}', '300x300')
            }];
        }
    }

    private processTracks(items: any[]): GenericTrack[] {
        return items.map(item => {
            const attributes = item.attributes;
            
            const artists: GenericArtist[] = [{
                name: attributes.artistName,
                // Add composer if available as additional artist
                ...(attributes.composerName && { id: `composer-${attributes.composerName}` })
            }];

            // If there's a composer different from the artist, add as additional artist
            if (attributes.composerName && attributes.composerName !== attributes.artistName) {
                artists.push({
                    name: attributes.composerName,
                    id: `composer-${attributes.composerName}`
                });
            }

            return {
                name: attributes.name,
                artists: artists,
                album: {
                    name: attributes.albumName,
                    images: attributes.artwork ? [
                        attributes.artwork.url.replace('{w}x{h}', '300x300')
                    ] : []
                },
                duration_ms: attributes.durationInMillis,
                isrc: attributes.isrc,
                // Additional metadata that might be useful
                preview_url: attributes.previews?.[0]?.url || null,
                explicit: attributes.contentRating === 'explicit'
            };
        });
    }

    // Maintain existing interface methods
    getFormattedDuration(): string {
        const totalMs = this.tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
        const minutes = Math.floor(totalMs / 60000);
        return `${minutes} min`;
    }

    getArtistNames(track: GenericTrack): string {
        return track.artists.map(artist => artist.name).join(', ');
    }
}