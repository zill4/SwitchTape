import type { GenericTrack, Playlist } from '../models/Playlist';
import { ResponseHandler } from './responseHandler';
import { AppleMusicPlaylist } from '../models/AppleMusicPlaylist';

export class AppleMusicService {
    private static instance: AppleMusicService;
    private musicKit: any;
    private isInitialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;
    private baseUrl = 'https://api.music.apple.com/v1';

    private constructor() {}

    static getInstance(): AppleMusicService {
        if (!AppleMusicService.instance) {
            AppleMusicService.instance = new AppleMusicService();
        }
        return AppleMusicService.instance;
    }

    private async getDeveloperToken(): Promise<string> {
        const cachedToken = localStorage.getItem('apple_developer_token');
        const tokenExpiry = localStorage.getItem('apple_token_expiry');

        if (cachedToken && tokenExpiry && this.isCachedDeveloperTokenUsable(cachedToken, tokenExpiry)) {
            return cachedToken;
        }

        localStorage.removeItem('apple_developer_token');
        localStorage.removeItem('apple_token_expiry');

        try {
            const response = await fetch('/api/musickit-token', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to get MusicKit token');
            const { token } = await response.json();
            const expiresIn = this.getJwtSecondsUntilExpiry(token) || 86400;

            localStorage.setItem('apple_developer_token', token);
            localStorage.setItem('apple_token_expiry', (Date.now() + expiresIn * 1000).toString());

            return token;
        } catch (error) {
            console.error('Failed to get developer token:', error);
            throw new Error('Failed to get Apple Music authorization token');
        }
    }

    private isCachedDeveloperTokenUsable(token: string, tokenExpiry: string): boolean {
        const expiry = parseInt(tokenExpiry, 10);
        if (!Number.isFinite(expiry) || Date.now() >= expiry - 60000) return false;

        try {
            const payload = this.decodeJwtPart(token, 1);
            const now = Math.floor(Date.now() / 1000);
            if (typeof payload.exp !== 'number' || payload.exp <= now + 60) return false;

            const currentOrigin = window.location.origin;
            const originClaim = payload.origin;
            if (Array.isArray(originClaim)) return originClaim.includes(currentOrigin);
            if (typeof originClaim === 'string') return originClaim === currentOrigin;

            return false;
        } catch {
            return false;
        }
    }

    private getJwtSecondsUntilExpiry(token: string): number | null {
        try {
            const payload = this.decodeJwtPart(token, 1);
            if (typeof payload.exp !== 'number') return null;

            return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
        } catch {
            return null;
        }
    }

    private decodeJwtPart(token: string, partIndex: number): any {
        const part = token.split('.')[partIndex];
        if (!part) throw new Error('Invalid JWT');

        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        return JSON.parse(atob(padded));
    }

    async getPlaylist(playlistId: string): Promise<Playlist> {
        if (!this.isInitialized) {
            await this.initialize();
        }

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
        const response = await fetch('/api/musickit-token', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to get MusicKit token');
        const { token } = await response.json();
        return token;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = (async () => {
            await this.waitForMusicKit();

            const token = await this.getDeveloperToken();

            if (!token) {
                throw new Error('Failed to get MusicKit token');
            }

            await this.configureMusicKit(token);
            this.musicKit = window.MusicKit.getInstance();

            if (!this.musicKit) {
                throw new Error('MusicKit instance was not created');
            }

            this.isInitialized = true;
            console.log('[AppleMusic] MusicKit initialized');
        })().catch((error) => {
            this.initializationPromise = null;
            console.error('Failed to initialize Apple Music:', error);
            throw new Error('Failed to initialize Apple Music');
        });

        return this.initializationPromise;
    }

    private async waitForMusicKit(timeoutMs: number = 10000): Promise<void> {
        if (typeof window === 'undefined') {
            throw new Error('MusicKit is only available in the browser');
        }

        if (window.MusicKit) return;

        await this.withTimeout(
            new Promise<void>((resolve) => {
                window.addEventListener('musickitloaded', () => resolve(), { once: true });
            }),
            timeoutMs,
            'MusicKit script did not load'
        );

        if (!window.MusicKit) {
            throw new Error('MusicKit script loaded but window.MusicKit is unavailable');
        }
    }

    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        try {
            return await Promise.race([
                promise,
                new Promise<T>((_, reject) => {
                    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
                }),
            ]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    }

    private async configureMusicKit(developerToken: string): Promise<void> {
        try {
            await window.MusicKit.configure({
                developerToken,
                app: {
                    name: 'SwitchTape',
                    build: '1.0.0'
                }
            });
        } catch (error) {
            console.error('[AppleMusic] configure() failed:', error);
            throw new Error('Failed to configure MusicKit');
        }
    }

    isReady(): boolean {
        return this.isInitialized && !!this.musicKit;
    }

    /**
     * Starts MusicKit.authorize() on the current call stack so the browser
     * still treats it as a user gesture. Call from a click handler; do not
     * await initialize() first.
     */
    authorizeFromClick(): Promise<void> {
        if (!this.isInitialized || !this.musicKit) {
            throw new Error('Apple Music is still loading. Wait a moment and try again.');
        }

        if (this.musicKit.isAuthorized && this.musicKit.musicUserToken) {
            console.log('[AppleMusic] already authorized. User token present: true');
            return Promise.resolve();
        }

        console.log('[AppleMusic] starting authorize()');
        return this.finishAuthorize(this.musicKit.authorize());
    }

    async authorize(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.authorizeFromClick();
    }

    private async finishAuthorize(authPromise: Promise<unknown>): Promise<void> {
        try {
            const userToken = await this.withTimeout(
                authPromise,
                180000,
                'Apple Music authorization timed out. Finish the Apple sign-in popup, then check whether the popup closed or the callback was blocked.'
            );
            const token = userToken || this.musicKit.musicUserToken;
            console.log('[AppleMusic] authorize() resolved. User token present:', !!token);

            if (!token) {
                throw new Error('Apple Music did not return a user token');
            }
        } catch (error: any) {
            console.error('[AppleMusic] authorize() failed:', {
                message: error?.message,
                name: error?.name,
                errorCode: error?.errorCode,
                description: error?.description,
                full: error,
            });
            throw new Error(
                error?.errorCode === 'USER_AUTH_CANCELLED'
                    ? 'You cancelled the Apple Music sign-in'
                    : error?.message || 'Failed to authorize with Apple Music'
            );
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
            const searchTerm = `${track.name} ${track.artists[0].name}`
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '+');

            const response = await this.makeRequest(
                `/catalog/us/search?types=songs&term=${searchTerm}&limit=1`
            );

            if (response.results?.songs?.data?.[0]) {
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

        const BATCH_SIZE = 20;
        for (let i = 0; i < foundTracks.length; i += BATCH_SIZE) {
            const batch = foundTracks.slice(i, i + BATCH_SIZE);
            const batchTracks = tracks.slice(i, i + BATCH_SIZE);
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

    // ─── Report Card data sources ─────────────────────────────────────────

    /**
     * Heavy rotation: most-played albums, playlists, stations.
     * Returns up to 10 items by default.
     */
    async getHeavyRotation(limit: number = 10): Promise<AppleHeavyRotationItem[]> {
        const response = await this.makeRequest(
            `/me/history/heavy-rotation?limit=${limit}`
        );
        return (response?.data || []).map((item: any) => ({
            id: item.id,
            type: item.type,
            name: item.attributes?.name || '',
            artistName: item.attributes?.artistName || '',
            genreNames: item.attributes?.genreNames || [],
            releaseDate: item.attributes?.releaseDate || '',
        }));
    }

    /**
     * Recently played tracks (last ~30).
     */
    async getRecentlyPlayedTracks(limit: number = 30): Promise<AppleRecentTrack[]> {
        const response = await this.makeRequest(
            `/me/recent/played/tracks?limit=${limit}`
        );
        return (response?.data || [])
            .filter((item: any) => item.type === 'songs')
            .map((item: any) => ({
                id: item.id,
                name: item.attributes?.name || '',
                artistName: item.attributes?.artistName || '',
                albumName: item.attributes?.albumName || '',
                genreNames: item.attributes?.genreNames || [],
                releaseDate: item.attributes?.releaseDate || '',
                durationInMillis: item.attributes?.durationInMillis || 0,
            }));
    }

    /**
     * Apple's personal recommendations — useful as an "adjacent taste" signal.
     * Flattens recommendation groups into their content items.
     */
    async getRecommendations(): Promise<AppleRecommendationItem[]> {
        const response = await this.makeRequest(`/me/recommendations`);
        const items: AppleRecommendationItem[] = [];

        for (const rec of response?.data || []) {
            const contents = rec.relationships?.contents?.data || [];
            for (const item of contents) {
                if (item?.attributes?.name) {
                    items.push({
                        id: item.id,
                        type: item.type,
                        name: item.attributes.name,
                        artistName: item.attributes?.artistName || '',
                        genreNames: item.attributes?.genreNames || [],
                    });
                }
            }
        }

        return items;
    }
}

export interface AppleHeavyRotationItem {
    id: string;
    type: string;
    name: string;
    artistName: string;
    genreNames: string[];
    releaseDate: string;
}

export interface AppleRecentTrack {
    id: string;
    name: string;
    artistName: string;
    albumName: string;
    genreNames: string[];
    releaseDate: string;
    durationInMillis: number;
}

export interface AppleRecommendationItem {
    id: string;
    type: string;
    name: string;
    artistName: string;
    genreNames: string[];
}
