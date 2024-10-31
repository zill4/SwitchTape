import { ResponseHandler } from "./responseHandler";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebase';

export class SpotifyService {
    private static baseUrl = 'https://api.spotify.com/v1';
    private static functions = getFunctions(app);
    
    private static async getAccessToken(): Promise<string> {
        // Try to get token from localStorage first
        const storedToken = localStorage.getItem('spotify_access_token');
        const tokenExpiry = localStorage.getItem('spotify_token_expiry');
        
        // Check if token exists and is not expired
        if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            return storedToken;
        }

        // If no valid token, refresh it
        return await this.refreshAccessToken();
    }
    
    private static async refreshAccessToken(): Promise<string> {
        try {
            const getSpotifyToken = httpsCallable(this.functions, 'getSpotifyToken');
            const result = await getSpotifyToken();
            
            const { access_token, expires_in } = result.data as any;
            
            // Store the new token and its expiry time
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
  
    static async getPlaylist(playlistId: string): Promise<any> {
        return ResponseHandler.retryWithNewToken(
            async (token: string) => {
                return fetch(`${this.baseUrl}/playlists/${playlistId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            },  
            async () => await this.getAccessToken()
        );
    }
}