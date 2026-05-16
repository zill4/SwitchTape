/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as jwt from 'jsonwebtoken';

admin.initializeApp();

export const getSpotifyToken = functions.https.onCall(async (data, context) => {
  try {
    // Get secret from Firebase environment config
    const spotifySecret = functions.config().spotify.client_secret;
    const spotifyClientId = functions.config().spotify.client_id;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', spotifyClientId);
    params.append('client_secret', spotifySecret);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify token');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in
    };
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get Spotify token');
  }
});

export const getMusicKitToken = functions.https.onCall(async (data, context) => {
  try {
    // Initialize Secret Manager client
    const secretManager = new SecretManagerServiceClient();
    
    // Get the private key from Secret Manager
    const [version] = await secretManager.accessSecretVersion({
      name: 'projects/772100231536/secrets/APPLE_MUSIC_PRIVATE_KEY/versions/latest'
    });

    // Get the private key and ensure it's properly formatted
    let privateKey = version.payload?.data?.toString() || '';
    
    // If the key doesn't include the PEM headers, add them
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
    
    // Get other required values from Firebase config
    const config = functions.config().musickit;
    
    const payload = {
      iss: config.team_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      keyid: config.key_id,
      header: {
        alg: 'ES256',
        kid: config.key_id
      }
    });

    return { token };
  } catch (error) {
    console.error('Error generating MusicKit token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate MusicKit token');
  }
});

export const generateMusicReport = functions.https.onCall(async (data, context) => {
  try {
    const { analysisInput } = data;

    if (!analysisInput || !analysisInput.trackCount || analysisInput.trackCount < 5) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Not enough listening data to generate a report'
      );
    }

    const secretManager = new SecretManagerServiceClient();
    const [version] = await secretManager.accessSecretVersion({
      name: 'projects/772100231536/secrets/ANTHROPIC_API_KEY/versions/latest'
    });
    const apiKey = version.payload?.data?.toString() || '';

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'API key not configured');
    }

    const prompt = `You are a music personality analyst for an app called SwitchTape. Analyze the following music listening data and generate a personality report.

Here is the user's music data:
${JSON.stringify(analysisInput, null, 2)}

Generate a JSON response matching this EXACT schema (no markdown, no code fences, just raw JSON):
{
  "listenerType": {
    "name": "The [Creative Name] (2-3 words max, e.g. The Nostalgic Rebel, The Crate Digger)",
    "tagline": "A witty one-liner about their music personality (under 30 words)"
  },
  "metrics": {
    "nostalgia": 0-100 (how retro their taste skews),
    "energy": 0-100 (how high-energy their music is),
    "depth": 0-100 (how emotionally complex their choices are),
    "range": 0-100 (how diverse across genres/eras),
    "mainstream": 0-100 (how popular their picks are, derive from averagePopularity),
    "replay": 0-100 (how likely they are to revisit the same songs)
  },
  "genreDNA": [
    { "genre": "Genre Name", "percentage": number }
  ] (top 5-6 genres by percentage, sorted descending, must sum to ~100),
  "eraMap": [
    { "decade": "1990s", "percentage": number }
  ] (all decades present in their data, sorted chronologically),
  "personalitySpectrum": [
    { "leftLabel": "CHILL", "rightLabel": "CHAOTIC", "value": 0-100 },
    { "leftLabel": "CLASSIC", "rightLabel": "MODERN", "value": 0-100 },
    { "leftLabel": "INTROSPECTIVE", "rightLabel": "ANTHEMIC", "value": 0-100 },
    { "leftLabel": "UNDERGROUND", "rightLabel": "MAINSTREAM", "value": 0-100 },
    { "leftLabel": "SOLO LISTENER", "rightLabel": "CROWD ENERGY", "value": 0-100 }
  ],
  "vibeTags": ["#lowercase-hashtag-vibes"] (exactly 10 hashtag mood tags, no spaces in tags, be creative and specific to their taste),
  "topArtists": [
    { "name": "Artist Name", "count": number }
  ] (top 8 artists by track count from the data),
  "deepCutAnalysis": [
    "paragraph 1",
    "paragraph 2",
    "paragraph 3",
    "paragraph 4"
  ] (4 paragraphs analyzing their personality through their music. Be witty, specific, reference actual artists/genres from their data. Write like a music journalist who knows their stuff. Each paragraph 2-3 sentences max.),
  "compatibility": {
    "mostCompatible": "The [Type Name] — brief description of who they'd vibe with",
    "leastCompatible": "The [Type Name] — brief description of who they'd clash with",
    "celebrityMatch": "[Celebrity Name]'s Spotify probably looks a lot like yours"
  }
}

Rules:
- Be creative, witty, and personality-driven
- Reference specific genres and patterns from the data
- The listener type name should be creative and memorable (e.g. The Nostalgic Rebel, The Midnight Crate Digger)
- Vibe tags should be lowercase hashtags with no spaces (use camelCase or dashes)
- Deep cut analysis should feel like it was written by a music journalist
- Return ONLY valid JSON, no other text`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new functions.https.HttpsError('internal', 'Failed to generate report');
    }

    const result = await response.json();
    const content = result.content?.[0]?.text || '';

    let report;
    try {
      report = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse Claude response:', content);
        throw new functions.https.HttpsError('internal', 'Invalid report format');
      }
    }

    return { report };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Error generating music report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate music report');
  }
});

export const exchangeSpotifyCode = functions.https.onCall(async (data, context) => {
  try {
    const { code, redirectUri } = data;
    
    // Get secrets from Firebase environment config
    const spotifySecret = functions.config().spotify.client_secret;
    const spotifyClientId = functions.config().spotify.client_id;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: spotifyClientId,
      client_secret: spotifySecret
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      console.error('Spotify token exchange failed:', await response.text());
      throw new functions.https.HttpsError('internal', 'Failed to exchange code');
    }

    const tokenData = await response.json();
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in
    };
  } catch (error) {
    console.error('Error exchanging Spotify code:', error);
    throw new functions.https.HttpsError('internal', 'Failed to exchange Spotify code');
  }
});