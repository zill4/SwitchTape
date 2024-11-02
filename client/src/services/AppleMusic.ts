import { getFunctions, httpsCallable } from 'firebase/functions';
import type { GenericTrack, Playlist } from '../models/Playlist';
import { app } from '../../firebase';
import { ResponseHandler } from './responseHandler';
import { AppleMusicPlaylist } from '../models/AppleMusicPlaylist';

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

    private async getDeveloperToken(): Promise<string> {
        // Check localStorage first
        const cachedToken = localStorage.getItem('apple_developer_token');
        const tokenExpiry = localStorage.getItem('apple_token_expiry');
        
        if (cachedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            return cachedToken;
        }

        // Get new token if none cached or expired
        try {
            const getMusicKitToken = httpsCallable(AppleMusicService.functions, 'getMusicKitToken');
            const result = await getMusicKitToken();
            const { token, expiresIn = 86400 } = result.data as { token: string; expiresIn: number };
            
            // Store token with expiry (default 24 hours if not specified)
            localStorage.setItem('apple_developer_token', token);
            localStorage.setItem('apple_token_expiry', (Date.now() + expiresIn * 1000).toString());
            
            return token;
        } catch (error) {
            console.error('Failed to get developer token:', error);
            throw new Error('Failed to get Apple Music authorization token');
        }
    }

    async getPlaylist(playlistId: string): Promise<Playlist> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // const playlistId = this.extractPlaylistId(url);
        if (!playlistId) {
            throw new Error('Invalid Apple Music playlist URL');
        }

        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const response = await fetch(
                    `${this.baseUrl}/catalog/us/playlists/${playlistId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Music-User-Token': this.musicKit.musicUserToken || '',
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch playlist: ${response.statusText}`);
                }

                const data = await response.json();
                return this.transformPlaylist(data.data[0]);
            },
            async () => await this.getDeveloperToken()
        );
    }

    private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
        if (!this.musicKit?.isAuthorized) {
            await this.authorize();
        }

        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Music-User-Token': this.musicKit.musicUserToken,
                        'Content-Type': 'application/json'
                    },
                    body: body ? JSON.stringify(body) : undefined
                });

                if (!response.ok) {
                    throw new Error(`Request failed: ${response.statusText}`);
                }

                // Return null for 204 No Content responses
                if (response.status === 204) {
                    return null;
                }

                return await response.json();
            },
            async () => await this.getDeveloperToken()
        );
    }

    private transformPlaylist(applePlaylist: any): Playlist {
        const tracks = applePlaylist.relationships.tracks.data.map((track: any) => ({
            name: track.attributes.name,
            artists: [{
                id: track.attributes.artistId,
                name: track.attributes.artistName
            }],
            album: {
                id: track.attributes.albumId,
                name: track.attributes.albumName,
                images: track.attributes.artwork ? 
                    [track.attributes.artwork.url.replace('{w}x{h}', '300x300')] : 
                    []
            },
            duration_ms: track.attributes.durationInMillis,
            isrc: track.attributes.isrc
        }));

        return {
            name: applePlaylist.attributes.name,
            description: applePlaylist.attributes.description?.standard || '',
            tracks,
            totalTracks: tracks.length,
            image: applePlaylist.attributes.artwork.url.replace('{w}x{h}', '300x300'),
            getFormattedDuration: function() {
                const totalMs = tracks.reduce((sum: any, track: { duration_ms: any; }) => sum + track.duration_ms, 0);
                const minutes = Math.floor(totalMs / 60000);
                return `${minutes} min`;
            },
            getArtistNames: function(track: GenericTrack): string {
                return [...new Set(tracks.flatMap((track: { artists: any[]; }) => track.artists.map((artist: { name: any; }) => artist.name)))].join(', ');
            },
            platform: 'apple'
        };
    }
    
    private transformApplePlaylist(applePlaylist: any): Playlist {
        return new AppleMusicPlaylist(applePlaylist);
    }

    private extractPlaylistId(url: string): string | null {
        const match = url.match(/playlist\/.*\/(pl\.[a-zA-Z0-9]+)/);
        return match ? match[1] : null;
      }
    
    async getToken(): Promise<string> {
        const getMusicKitToken = httpsCallable(AppleMusicService.functions, 'getMusicKitToken');
        const result = await getMusicKitToken();
        const { token } = result.data as { token: string };
        return token;
    }
    
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Get token from Firebase function
            const token = await this.getToken();

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

    async addTracksToPlaylist(
        playlistId: string, 
        tracks: GenericTrack[], 
        onProgress?: (status: string, progress: number, phase: 'searching' | 'adding' | 'complete', currentTrack?: GenericTrack) => void
    ): Promise<void> {
        const foundTracks: string[] = [];
        const notFoundTracks: GenericTrack[] = [];

        // First, find all matching tracks
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            onProgress?.(
                `Searching for "${track.name}" by ${track.artists[0].name}...`, 
                (i / tracks.length) * 50,
                'searching',
                track
            );
            
            const trackId = await this.searchTrack(track);
            if (trackId) {
                foundTracks.push(trackId);
            } else {
                notFoundTracks.push(track);
            }
        }

        // Add tracks in batches of 20
        const BATCH_SIZE = 20;
        for (let i = 0; i < foundTracks.length; i += BATCH_SIZE) {
            const batch = foundTracks.slice(i, i + BATCH_SIZE);
            const batchTracks = tracks.slice(i, i + BATCH_SIZE); // Get corresponding original tracks
            const progress = 50 + ((i / foundTracks.length) * 50);
            
            try {
                const data = {
                    data: batch.map(id => ({
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

                await this.makeRequest(
                    `/me/library/playlists/${playlistId}/tracks`, 
                    'POST', 
                    data
                );

                // Update progress with all tracks in the batch
                batchTracks.forEach(track => {
                    onProgress?.(
                        `Adding tracks ${i + 1}-${Math.min(i + BATCH_SIZE, foundTracks.length)} of ${foundTracks.length}...`, 
                        progress,
                        'adding',
                        track
                    );
                });

                if (i + BATCH_SIZE < foundTracks.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`Failed to add batch ${i / BATCH_SIZE + 1}:`, error);
                throw error;
            }
        }

        onProgress?.('Playlist conversion complete!', 100, 'complete');

        if (notFoundTracks.length > 0) {
            console.warn('Some tracks were not found:', notFoundTracks);
        }
    }

    private getStorefront(): string {
        return this.musicKit.storefrontId || 'us';
    }
}