import { getFunctions, httpsCallable } from 'firebase/functions';
import type { GenericTrack } from '../models/Playlist';
import { app } from '../../firebase';

export class AppleMusicService {
    private static instance: AppleMusicService;
    private musicKit: any;
    private isInitialized: boolean = false;
    private static functions = getFunctions(app);
    private baseUrl = 'https://api.music.apple.com/v1';

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
            const getMusicKitToken = httpsCallable(AppleMusicService.functions, 'getMusicKitToken');
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

    private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
        if (!this.musicKit.isAuthorized) {
            await this.authorize();
        }

        console.log(`Making ${method} request to ${endpoint}`);
        console.log('Request body:', body);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.musicKit.developerToken}`,
                'Music-User-Token': this.musicKit.musicUserToken,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('API Error Response:', responseText);
            throw new Error(`Apple Music API error: ${response.statusText} - ${responseText}`);
        }

        // Only parse as JSON if there's content
        return responseText ? JSON.parse(responseText) : null;
    }

    async createPlaylist(name: string, description: string = ''): Promise<string> {
        const data = {
            attributes: {
                name,
                description
            }
        };

        try {
            const response = await this.makeRequest('/me/library/playlists', 'POST', data);
            return response.data[0].id;
        } catch (error) {
            console.error('Failed to create playlist:', error);
            throw new Error('Failed to create playlist');
        }
    }

    async searchTrack(track: GenericTrack): Promise<string | null> {
        try {
            // Format search term: "song name artist name"
            const searchTerm = `${track.name} ${track.artists[0].name}`
                .toLowerCase()
                .replace(/[^\w\s]/g, '') // Remove special characters
                .replace(/\s+/g, '+');   // Replace spaces with +

            const response = await this.makeRequest(
                `/catalog/us/search?types=songs&term=${searchTerm}&limit=1`
            );
            
            if (response.results?.songs?.data?.[0]) {
                // Verify the match by comparing artist names
                const result = response.results.songs.data[0];
                const artistMatch = result.attributes.artistName
                    .toLowerCase()
                    .includes(track.artists[0].name.toLowerCase());
                
                if (artistMatch) {
                    return result.id;
                }
            }
            return null;
        } catch (error) {
            console.error(`Failed to search for track: ${track.name}`, error);
            return null;
        }
    }

    async addTracksToPlaylist(playlistId: string, tracks: GenericTrack[]): Promise<void> {
        const foundTracks: string[] = [];
        const notFoundTracks: GenericTrack[] = [];

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
                // The correct data structure for the Apple Music API
                const data = {
                    data: foundTracks.map(id => ({
                        id,
                        type: 'songs',
                        relationships: {
                            catalog: {
                                data: [{
                                    id,
                                    type: 'songs'
                                }]
                            }
                        }
                    }))
                };

                console.log('Request data:', JSON.stringify(data, null, 2)); // Debug log

                const response = await this.makeRequest(
                    `/me/library/playlists/${playlistId}/tracks`, 
                    'POST', 
                    data
                );

                console.log('Response:', response); // Debug log
            } catch (error) {
                console.error('Failed to add tracks to playlist:', error);
                if (error instanceof Response) {
                    const errorText = await error.text();
                    console.error('Error response:', errorText);
                }
                throw new Error('Failed to add tracks to playlist');
            }
        }

        if (notFoundTracks.length > 0) {
            console.warn('Some tracks were not found:', notFoundTracks);
        }
    }

    private getStorefront(): string {
        return this.musicKit.storefrontId || 'us';
    }
}