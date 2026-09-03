declare global {
    interface Window {
        spotifyCallback: (code: string) => Promise<void>;
    }
}

import { ResponseHandler } from "./responseHandler";
import { SpotifyPlaylist } from "../models/SpotifyPlaylist";
import type { GenericTrack } from "../models/Playlist";
import type { SpotifyTopTrack, SpotifyTopArtist } from "../models/ReportCard";

export class SpotifyService {
    private static baseUrl = 'https://api.spotify.com/v1';
    private static clientId = import.meta.env.PUBLIC_SPOTIFY_CLIENT_ID;
    private static redirectUri = typeof window !== 'undefined'
        ? `${window.location.origin}/spotify`
        : '';

        static async authorize(): Promise<void> {
            if (typeof window === 'undefined') return;

            if (!this.clientId) {
                throw new Error('Spotify is not configured on this site.');
            }

            const scope = [
                'playlist-modify-private',
                'playlist-modify-public',
                'user-read-private',
                'user-read-email',
                'user-top-read'
            ].join(' ');

            const params = new URLSearchParams({
                response_type: 'code',
                client_id: this.clientId,
                scope,
                redirect_uri: this.redirectUri,
                state: crypto.randomUUID()
            });
            const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

            sessionStorage.setItem(
                'spotify_oauth_return',
                `${window.location.pathname}${window.location.search}`
            );
            if (window.location.pathname.includes('report-card')) {
                sessionStorage.setItem('spotify_oauth_intent', 'report');
            }

            // Must run in the click stack. A blocked popup used to hang forever
            // because `null?.closed` is never true.
            const popup = window.open(
                authUrl,
                'spotify_login',
                'width=500,height=700,left=200,top=100'
            );

            if (!popup) {
                window.location.assign(authUrl);
                return new Promise(() => {});
            }

            return new Promise((resolve, reject) => {
                const popupTimer = setInterval(() => {
                    if (!popup.closed) return;
                    clearInterval(popupTimer);
                    const token = localStorage.getItem('spotify_access_token');
                    const expiry = localStorage.getItem('spotify_token_expiry');
                    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
                        resolve();
                        return;
                    }
                    reject(new Error('Authentication cancelled'));
                }, 500);

                window.spotifyCallback = async (code: string) => {
                    popup.close();
                    clearInterval(popupTimer);

                    try {
                        const response = await fetch('/api/exchange-spotify-code', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code, redirectUri: this.redirectUri }),
                        });

                        if (!response.ok) throw new Error('Token exchange failed');
                        const { access_token, refresh_token, expires_in } = await response.json();

                        localStorage.setItem('spotify_access_token', access_token);
                        localStorage.setItem('spotify_refresh_token', refresh_token);
                        localStorage.setItem('spotify_token_expiry',
                            (Date.now() + (expires_in * 1000)).toString()
                        );

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
            });
        }

    private static async getAccessToken(): Promise<string> {
        const storedToken = localStorage.getItem('spotify_access_token');
        const tokenExpiry = localStorage.getItem('spotify_token_expiry');

        if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            return storedToken;
        }

        const refreshToken = localStorage.getItem('spotify_refresh_token');
        if (refreshToken) {
            return await this.refreshAccessToken();
        }

        this.authorize();
        throw new Error('Authorization required');
    }

    private static async refreshAccessToken(): Promise<string> {
        try {
            const response = await fetch('/api/spotify-token', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to refresh token');
            const { access_token, expires_in } = await response.json();

            localStorage.setItem('spotify_access_token', access_token);
            localStorage.setItem('spotify_token_expiry',
                (Date.now() + (expires_in * 1000)).toString()
            );

            return access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    }

    private static async getClientToken(): Promise<string> {
        const response = await fetch('/api/spotify-token', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to get client token');
        const { access_token } = await response.json();
        return access_token;
    }

    static async getPlaylist(id: string): Promise<SpotifyPlaylist> {
        try {
            const access_token = await this.getClientToken();

            const response = await fetch(`${this.baseUrl}/playlists/${id}`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return new SpotifyPlaylist(data);
            }

            const albumResponse = await fetch(`${this.baseUrl}/albums/${id}`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (albumResponse.ok) {
                const albumData = await albumResponse.json();
                const playlistData = {
                    id: albumData.id,
                    name: albumData.name,
                    description: `Album by ${albumData.artists[0].name}`,
                    images: albumData.images,
                    tracks: {
                        items: albumData.tracks.items.map((track: any) => ({
                            track: {
                                ...track,
                                album: albumData
                            }
                        })),
                        total: albumData.tracks.total
                    },
                    uri: albumData.uri
                };
                return new SpotifyPlaylist(playlistData);
            }

            if (response.status === 401 || albumResponse.status === 401) {
                return this.getPlaylistWithUserAuth(id);
            }

            throw new Error('Resource not found');
        } catch (error) {
            console.error('Failed to fetch playlist/album:', error);
            throw error;
        }
    }

    private static async getPlaylistWithUserAuth(id: string): Promise<SpotifyPlaylist> {
        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const playlistResponse = await fetch(`${this.baseUrl}/playlists/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (playlistResponse.ok) {
                    const data = await playlistResponse.json();
                    return new SpotifyPlaylist(data);
                }

                const albumResponse = await fetch(`${this.baseUrl}/albums/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!albumResponse.ok) {
                    throw new Error('Failed to fetch playlist or album');
                }

                const albumData = await albumResponse.json();
                const playlistData = {
                    id: albumData.id,
                    name: albumData.name,
                    description: `Album by ${albumData.artists[0].name}`,
                    images: albumData.images,
                    tracks: {
                        items: albumData.tracks.items.map((track: any) => ({
                            track: {
                                ...track,
                                album: albumData
                            }
                        })),
                        total: albumData.tracks.total
                    },
                    uri: albumData.uri
                };

                return new SpotifyPlaylist(playlistData);
            },
            async () => await this.getAccessToken()
        );
    }

    static async createPlaylist(name: string, description?: string): Promise<string> {
        const userId = await this.getCurrentUserId();
        const truncatedDescription = description && description.length > 300
            ? description.substring(0, 297) + '...'
            : description;

        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const response = await fetch(`${this.baseUrl}/users/${userId}/playlists`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        description: truncatedDescription,
                        public: false
                    })
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('Playlist creation failed:', errorData);
                    throw new Error('Failed to create playlist');
                }

                const data = await response.json();
                return data.id;
            },
            async () => await this.getAccessToken()
        );
    }

    static async searchTrack(track: GenericTrack): Promise<string | null> {
        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const query = encodeURIComponent(`track:${track.name} artist:${track.artists[0].name}`);
                const response = await fetch(
                    `${this.baseUrl}/search?q=${query}&type=track&limit=1`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to search track');
                }

                const data = await response.json();
                if (data.tracks?.items?.[0]) {
                    return data.tracks.items[0].uri;
                }
                return null;
            },
            async () => await this.getAccessToken()
        );
    }

    static async addTracksToPlaylist(
        playlistId: string,
        tracks: GenericTrack[],
        onProgress?: (status: string, progress: number, phase: 'searching' | 'adding', currentTrack?: GenericTrack) => void
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

            const trackUri = await this.searchTrack(track);
            if (trackUri) {
                foundTracks.push(trackUri);
            } else {
                notFoundTracks.push(track);
            }
        }

        const BATCH_SIZE = 100;
        for (let i = 0; i < foundTracks.length; i += BATCH_SIZE) {
            const batch = foundTracks.slice(i, i + BATCH_SIZE);
            const progress = 50 + ((i / foundTracks.length) * 50);

            onProgress?.(
                `Adding tracks ${i + 1}-${Math.min(i + BATCH_SIZE, foundTracks.length)} of ${foundTracks.length}...`,
                progress,
                'adding'
            );

            await ResponseHandler.retryWithNewToken(
                async (token: string) => {
                    const response = await fetch(`${this.baseUrl}/playlists/${playlistId}/tracks`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            uris: batch
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to add tracks to playlist');
                    }
                },
                async () => await this.getAccessToken()
            );

            if (i + BATCH_SIZE < foundTracks.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (notFoundTracks.length > 0) {
            console.warn('Some tracks were not found:', notFoundTracks);
        }
    }

    private static async getCurrentUserId(): Promise<string> {
        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const response = await fetch(`${this.baseUrl}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to get user profile');
                }

                const data = await response.json();
                return data.id;
            },
            async () => await this.getAccessToken()
        );
    }

    static async getUserProfile(): Promise<{ display_name: string; images: Array<{ url: string }> }> {
        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const response = await fetch(`${this.baseUrl}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to get user profile');
                }

                const data = await response.json();
                return { display_name: data.display_name, images: data.images };
            },
            async () => await this.getAccessToken()
        );
    }

    static async getTopTracks(
        timeRange: 'long_term' | 'medium_term' | 'short_term' = 'long_term'
    ): Promise<SpotifyTopTrack[]> {
        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const response = await fetch(
                    `${this.baseUrl}/me/top/tracks?time_range=${timeRange}&limit=50`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch top tracks');
                }

                const data = await response.json();
                return data.items as SpotifyTopTrack[];
            },
            async () => await this.getAccessToken()
        );
    }

    static async getTopArtists(
        timeRange: 'long_term' | 'medium_term' | 'short_term' = 'long_term'
    ): Promise<SpotifyTopArtist[]> {
        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                const response = await fetch(
                    `${this.baseUrl}/me/top/artists?time_range=${timeRange}&limit=50`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch top artists');
                }

                const data = await response.json();
                return data.items as SpotifyTopArtist[];
            },
            async () => await this.getAccessToken()
        );
    }
}
