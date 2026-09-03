import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export function SpotifyCallback() {
    const [message, setMessage] = useState('Completing authorization...');

    useEffect(() => {
        const handleCallback = async () => {
            if (typeof window === 'undefined') return;

            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const redirectUri = `${window.location.origin}/spotify`;

            if (error) {
                if (typeof window.opener?.spotifyCallback === 'function') {
                    window.close();
                    return;
                }
                setMessage('Spotify authorization was cancelled. You can close this window.');
                return;
            }

            if (!code) {
                setMessage('Missing Spotify authorization code.');
                return;
            }

            if (typeof window.opener?.spotifyCallback === 'function') {
                await window.opener.spotifyCallback(code);
                window.close();
                return;
            }

            try {
                const response = await fetch('/api/exchange-spotify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, redirectUri }),
                });
                if (!response.ok) throw new Error('Token exchange failed');
                const { access_token, refresh_token, expires_in } = await response.json();

                localStorage.setItem('spotify_access_token', access_token);
                localStorage.setItem('spotify_refresh_token', refresh_token);
                localStorage.setItem(
                    'spotify_token_expiry',
                    (Date.now() + expires_in * 1000).toString()
                );

                window.close();
                if (!window.closed) {
                    const returnTo = sessionStorage.getItem('spotify_oauth_return') || '/report-card';
                    sessionStorage.removeItem('spotify_oauth_return');
                    window.location.replace(returnTo);
                }
            } catch (err: any) {
                setMessage(err?.message || 'Token exchange failed.');
            }
        };

        void handleCallback();
    }, []);

    return (
        <div class="auth-container">
            <div class="loading">
                <div class="spinner"></div>
                <p>{message}</p>
            </div>
        </div>
    );
}
