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