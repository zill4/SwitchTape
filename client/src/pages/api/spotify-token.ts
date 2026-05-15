import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async () => {
    try {
        const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
        const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });

        if (!response.ok) {
            throw new Error('Failed to get Spotify token');
        }

        const data = await response.json();
        return new Response(JSON.stringify({
            access_token: data.access_token,
            expires_in: data.expires_in,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error getting Spotify token:', error);
        return new Response(JSON.stringify({ error: 'Failed to get Spotify token' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
