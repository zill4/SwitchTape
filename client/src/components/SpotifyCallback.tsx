import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebase';
import '../styles/SpotifyCallback.css';
import { PlaylistState } from '../state/playlistState';
import { SpotifyService } from '../services/spotify';

export function SpotifyCallback() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            if (typeof window === 'undefined') return;

            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const state = urlParams.get('state');

            if (error) {
                setError('Failed to authorize with Spotify');
                return;
            }

            if (!code) {
                setError('No authorization code received');
                return;
            }

            try {
                const functions = getFunctions(app);
                const exchangeSpotifyCode = httpsCallable(functions, 'exchangeSpotifyCode');
                
                const result = await exchangeSpotifyCode({ 
                    code,
                    redirectUri: `${window.location.origin}/spotify`
                });
                
                const { access_token, refresh_token, expires_in } = result.data as any;

                // Store tokens
                localStorage.setItem('spotify_access_token', access_token);
                localStorage.setItem('spotify_refresh_token', refresh_token);
                localStorage.setItem('spotify_token_expiry', 
                    (Date.now() + (expires_in * 1000)).toString()
                );

                // Check if we're in the conversion flow
                const destinationPlatform = PlaylistState.getDestinationPlatform();
                const sourcePlaylist = PlaylistState.getSourcePlaylist();

                if (destinationPlatform === 'spotify' && sourcePlaylist) {
                    // We're in the conversion flow, continue with playlist creation
                    try {
                        const playlistId = await SpotifyService.createPlaylist(
                            sourcePlaylist.name,
                            sourcePlaylist.description
                        );
                        PlaylistState.setDestinationPlaylistId(playlistId);
                        window.location.href = '/conversion-progress';
                    } catch (error) {
                        setError('Failed to create playlist');
                    }
                } else {
                    // We're in the initial load flow
                    window.location.href = '/select-destination';
                }
            } catch (error) {
                console.error('Token exchange error:', error);
                setError('Failed to exchange authorization code');
            }
        };

        handleCallback();
    }, []);

    return (
        <div class="auth-container">
            {error ? (
                <div class="error-message">
                    {error}
                    <button onClick={() => window.location.href = '/select-destination'}>
                        Try Again
                    </button>
                </div>
            ) : (
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Authorizing with Spotify...</p>
                </div>
            )}
        </div>
    );
}
