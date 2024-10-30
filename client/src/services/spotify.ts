export class SpotifyService {
    private static baseUrl = 'https://api.spotify.com/v1';
    private static tokenUrl = 'https://accounts.spotify.com/api/token';
    
    private static async refreshAccessToken() {
      const basic = btoa(`${import.meta.env.SPOTIFY_CLIENT_ID}:${import.meta.env.SPOTIFY_CLIENT_SECRET}`);
      
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });
  
      const data = await response.json();
      return data.access_token;
    }
  
    static async getPlaylist(playlistId: string): Promise<any> {
      try {
        let accessToken = import.meta.env.SPOTIFY_ACCESS_TOKEN;
  
        const response = await fetch(`${this.baseUrl}/playlists/${playlistId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (response.status === 401) {
          // Token expired, get new one
          accessToken = await this.refreshAccessToken();
          // Retry request with new token
          return this.getPlaylist(playlistId);
        }
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error fetching playlist:', error);
        throw error;
      }
    }
}