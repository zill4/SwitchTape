import { Playlist, type GenericTrack, type GenericArtist } from "./Playlist";

export class AppleMusicPlaylist extends Playlist {

    constructor(playlistData: any) {
        super(playlistData.attributes.name, playlistData.attributes.description, []);
        this.tracks = this.processTracks(playlistData.relationships.tracks.data);
    }

    private processTracks(items: any[]): GenericTrack[] {
        return items.map(item => {
            const trackData = item.attributes;
            const artists: GenericArtist[] = [{ name: trackData.artistName }];

            return {
                name: trackData.name,
                artists: artists,
                album: { name: trackData.albumName },
                duration_ms: trackData.duration,
            };
        });
    }
}