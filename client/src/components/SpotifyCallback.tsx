import { h } from 'preact';
import { useEffect } from 'preact/hooks';

export function SpotifyCallback() {
    useEffect(() => {
        const handleCallback = () => {
            if (typeof window === 'undefined') return;

            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');

            if (window.opener) {
                if (error) {
                    window.opener.spotifyCallback(null, new Error('Failed to authorize with Spotify'));
                } else if (code) {
                    window.opener.spotifyCallback(code);
                }
            }
            // Close this window automatically
            window.close();
        };

        handleCallback();
    }, []);

    return (
        <div class="auth-container">
            <div class="loading">
                <div class="spinner"></div>
                <p>Completing authorization...</p>
            </div>
        </div>
    );
}
