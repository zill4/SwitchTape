import { SpotifyPlaylist, type SpotifyTrack } from '../models/SpotifyPlaylist';
import { Playlist, type GenericTrack } from '../models/Playlist';
export class PlaylistConverter {
    static fromSpotify(spotifyPlaylist: SpotifyPlaylist): Playlist {
        const tracks: GenericTrack[] = spotifyPlaylist.tracks.map((track: SpotifyTrack) => ({
            name: track.name,
            artists: track.artists,
            album: { name: track.album.name },
            duration_ms: track.duration_ms,
        }));

        return new Playlist(
            spotifyPlaylist.name,
            spotifyPlaylist.description,
            tracks
        );
    }

    static toSpotifyFormat(track: GenericTrack) {
        return {
            name: track.name,
            duration_ms: track.duration_ms,
            artists: track.artists,
            album: {
                name: track.album.name,
            },
        };
    }
}