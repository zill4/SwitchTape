import { ResponseHandler } from "./responseHandler";

export class SpotifyService {
    private static baseUrl = 'https://api.spotify.com/v1';
    private static tokenUrl = 'https://accounts.spotify.com/api/token';
    
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
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', import.meta.env.SPOTIFY_CLIENT_ID);
        params.append('client_secret', import.meta.env.SPOTIFY_CLIENT_SECRET);
        console.log('params', params);
        console.log('tokenUrl', import.meta.env.SPOTIFY_CLIENT_ID);
        console.log('clientSecret', import.meta.env.SPOTIFY_CLIENT_SECRET);
        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });
  
        const data = await response.json();
        console.log('data', data);
        // Store the new token and its expiry time
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_expiry', 
            (Date.now() + (data.expires_in * 1000)).toString()
        );
        
        return data.access_token;
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