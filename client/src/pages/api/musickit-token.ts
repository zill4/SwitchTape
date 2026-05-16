import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const runtimeEnv = (globalThis as typeof globalThis & {
            process?: { env?: Record<string, string | undefined> };
        }).process?.env || {};
        let privateKey = runtimeEnv.APPLE_MUSIC_PRIVATE_KEY || import.meta.env.APPLE_MUSIC_PRIVATE_KEY || '';
        const teamId = runtimeEnv.APPLE_MUSIC_TEAM_ID || import.meta.env.APPLE_MUSIC_TEAM_ID;
        const keyId = runtimeEnv.APPLE_MUSIC_KEY_ID || import.meta.env.APPLE_MUSIC_KEY_ID;

        if (!privateKey || !teamId || !keyId) {
            return new Response(JSON.stringify({ error: 'Apple Music not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
        }

        // Determine the origin requesting the token. MusicKit's auth handshake validates
        // the user-token exchange against the origin claim in the dev token. Production
        // redirects from apex to www, so production tokens include both canonical origins.
        const envOrigins = (runtimeEnv.APPLE_MUSIC_ALLOWED_ORIGINS || import.meta.env.APPLE_MUSIC_ALLOWED_ORIGINS || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
        const requestOrigin = request.headers.get('origin') || '';
        let requestHostname = '';

        try {
            requestHostname = requestOrigin ? new URL(requestOrigin).hostname : '';
        } catch {
            requestHostname = '';
        }

        const productionOrigins = ['https://switchtape.com', 'https://www.switchtape.com'];
        const isProductionOrigin = requestHostname === 'switchtape.com'
            || requestHostname === 'www.switchtape.com';
        const origins = Array.from(new Set(
            envOrigins.length > 0
                ? envOrigins
                : isProductionOrigin
                    ? productionOrigins
                    : requestOrigin
                        ? [requestOrigin]
                        : []
        ));

        const header = { alg: 'ES256', kid: keyId };
        const now = Math.floor(Date.now() / 1000);
        const payload: Record<string, unknown> = {
            iss: teamId,
            iat: now,
            exp: now + 86400,
        };
        if (origins.length > 0) {
            payload.origin = origins;
        }

        const { subtle } = globalThis.crypto;
        const pemBody = privateKey
            .replace('-----BEGIN PRIVATE KEY-----', '')
            .replace('-----END PRIVATE KEY-----', '')
            .replace(/\s/g, '');
        const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

        const key = await subtle.importKey(
            'pkcs8',
            keyData,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['sign']
        );

        const enc = new TextEncoder();
        const toBase64Url = (buf: ArrayBuffer) =>
            btoa(String.fromCharCode(...new Uint8Array(buf)))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const sigInput = enc.encode(`${headerB64}.${payloadB64}`);

        const signature = await subtle.sign(
            { name: 'ECDSA', hash: 'SHA-256' },
            key,
            sigInput
        );

        const token = `${headerB64}.${payloadB64}.${toBase64Url(signature)}`;

        return new Response(JSON.stringify({ token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error generating MusicKit token:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate MusicKit token' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
