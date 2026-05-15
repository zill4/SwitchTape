import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { code, redirectUri } = await request.json();
        const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
        const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        if (!response.ok) {
            console.error('Spotify token exchange failed:', await response.text());
            return new Response(JSON.stringify({ error: 'Failed to exchange code' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const tokenData = await response.json();
        return new Response(JSON.stringify({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error exchanging Spotify code:', error);
        return new Response(JSON.stringify({ error: 'Failed to exchange Spotify code' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
