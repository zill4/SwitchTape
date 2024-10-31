import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Track } from '../models/music';
import { AppleMusicPlaylist } from '../models/AppleMusicPlaylist';

export class AppleMusicService {
    private static instance: AppleMusicService;
    private musicKit: any;
    private isInitialized: boolean = false;

    private constructor() {}

    static getInstance(): AppleMusicService {
        if (!AppleMusicService.instance) {
            AppleMusicService.instance = new AppleMusicService();
        }
        return AppleMusicService.instance;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Get token from Firebase function
            const functions = getFunctions();
            const getMusicKitToken = httpsCallable(functions, 'getMusicKitToken');
            const result = await getMusicKitToken();
            const { token } = result.data as { token: string };

            if (!token) {
                throw new Error('Failed to get MusicKit token');
            }

            await this.configureMusicKit(token);
            this.musicKit = window.MusicKit.getInstance();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Apple Music:', error);
            throw new Error('Failed to initialize Apple Music');
        }
    }

    private async configureMusicKit(developerToken: string): Promise<void> {
        try {
            await window.MusicKit.configure({
                developerToken,
                app: {
                    name: 'Playlist Porter',
                    build: '1.0.0'
                }
            });
        } catch (error) {
            console.error('Failed to configure MusicKit:', error);
            throw new Error('Failed to configure MusicKit');
        }
    }

    async authorize(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.musicKit.authorize();
        } catch (error) {
            console.error('Failed to authorize with Apple Music:', error);
            throw new Error('Failed to authorize with Apple Music');
        }
    }

    async createPlaylist(name: string, description: string = ''): Promise<string> {
        if (!this.musicKit.isAuthorized) {
            await this.authorize();
        }

        try {
            const playlist = await this.musicKit.api.library.createPlaylist({
                name,
                description
            });

            return playlist.id;
        } catch (error) {
            console.error('Failed to create playlist:', error);
            throw new Error('Failed to create playlist');
        }
    }

    async searchTrack(track: Track): Promise<string | null> {
        try {
            const query = `${track.name} ${track.artists[0].name}`;
            const results = await this.musicKit.api.search(query, {
                types: ['songs'],
                limit: 1
            });

            if (results.songs.data.length > 0) {
                return results.songs.data[0].id;
            }
            return null;
        } catch (error) {
            console.error(`Failed to search for track: ${track.name}`, error);
            return null;
        }
    }

    async addTracksToPlaylist(playlistId: string, tracks: Track[]): Promise<void> {
        if (!this.musicKit.isAuthorized) {
            await this.authorize();
        }

        const foundTracks: string[] = [];
        const notFoundTracks: Track[] = [];

        for (const track of tracks) {
            const trackId = await this.searchTrack(track);
            if (trackId) {
                foundTracks.push(trackId);
            } else {
                notFoundTracks.push(track);
            }
        }

        if (foundTracks.length > 0) {
            try {
                await this.musicKit.api.library.addToPlaylist(playlistId, {
                    songs: foundTracks
                });
            } catch (error) {
                console.error('Failed to add tracks to playlist:', error);
                throw new Error('Failed to add tracks to playlist');
            }
        }

        if (notFoundTracks.length > 0) {
            console.warn('Some tracks were not found:', notFoundTracks);
        }
    }
}