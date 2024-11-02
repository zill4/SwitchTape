// LoadPlaylistCard.tsx - Preact Component
import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { SpotifyService } from '../services/spotify';
import { AppleMusicService } from '../services/AppleMusic';
import { PlaylistState } from '../state/playlistState';
import type { Playlist } from '../models/Playlist';
import type { SpotifyPlaylist } from '../models/SpotifyPlaylist';
import '../styles/LoadPlaylist.css';
import { AppleMusicPlaylist } from '../models/AppleMusicPlaylist';


export function LoadPlaylistCard() {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist | SpotifyPlaylist | AppleMusicPlaylist | null>(null);
  const [playlistImage, setPlaylistImage] = useState<string>('');
  const [showPlaylistView, setShowPlaylistView] = useState(false);
  
  const urlInputRef = useRef<HTMLInputElement>(null);
  const playlistCardRef = useRef<HTMLDivElement>(null);

  const determinePlaylistService = (url: string): 'spotify' | 'apple' | null => {
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('music.apple.com')) return 'apple';
    return null;
  };

  const extractPlaylistIdFromUrl = (url: string, service: 'spotify' | 'apple'): string | null => {
    switch (service) {
      case 'spotify':
        const spotifyMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
        return spotifyMatch ? spotifyMatch[1] : null;
      case 'apple':
        const appleMatch = url.match(/pl\.(.+)$/);
        return appleMatch ? `pl.${appleMatch[1]}` : null;
      default:
        return null;
    }
  };

  const handleLoadPlaylist = async () => {
    if (!urlInputRef.current) return;

    const url = urlInputRef.current.value.trim();
    const service = determinePlaylistService(url);

    if (!service) {
      setError('Invalid playlist URL. Please use a Spotify or Apple Music playlist URL.');
      return;
    }

    const playlistId = extractPlaylistIdFromUrl(url, service);
    console.log('playlistId', playlistId);
    if (!playlistId) {
      setError('Invalid playlist URL format');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let loadedPlaylist;
      
      if (service === 'spotify') {
        loadedPlaylist = await SpotifyService.getPlaylist(playlistId);
        setPlaylistImage(loadedPlaylist.images[0].url);
      } else {
        const appleMusicService = AppleMusicService.getInstance();
        loadedPlaylist = await appleMusicService.getPlaylist(playlistId); // Apple Music needs full URL
        setPlaylistImage(loadedPlaylist.image || '');
    }

      PlaylistState.setSourcePlaylist(loadedPlaylist);
      PlaylistState.setSourcePlatform(service); // Add this to PlaylistState if not exists
      
      setPlaylist(loadedPlaylist);
      

      setShowPlaylistView(true);
    } catch (error) {
      console.error('Failed to load playlist:', error);
      setError(
        service === 'apple' 
          ? "Failed to load Apple Music playlist. Please ensure you\'re authorized." 
          : 'Failed to load Spotify playlist'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = PlaylistState.subscribe(() => {
      setPlaylist(PlaylistState.getSourcePlaylist());
    });
    
    // Check if there's already a playlist in state
    const existingPlaylist = PlaylistState.getSourcePlaylist();
    if (existingPlaylist) {
      setPlaylist(existingPlaylist);
      if (playlistCardRef.current) {
        playlistCardRef.current.classList.remove('hidden');
      }
    }

    return () => unsubscribe();
  }, []);

  return (
    <>
      {!showPlaylistView ? (
        <div class="card" id="url-input-card">
          <h2>Load playlist from URL</h2>
          <input
            type="url"
            ref={urlInputRef}
            placeholder="Paste Spotify or Apple Music playlist URL"
            class="url-input"
          />
          <button 
            class="load-button" 
            onClick={handleLoadPlaylist}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load playlist'}
          </button>
          {error && (
            <div class="error-message">{error}</div>
          )}
        </div>
      ) : (
        <div class="card" id="playlist-card">
          <h2>From Your {PlaylistState.getSourcePlatform()} Account</h2>
          <div class="account-row">
            <div class="account-info">
              <i class={`fab fa-${PlaylistState.getSourcePlatform()}`} />
              <span>My {PlaylistState.getSourcePlatform()} Music Library</span>
            </div>
            <div class="user-info">
              <span class="username">Justin Crisp</span>
              <i class="fas fa-arrow-right" />
            </div>
          </div>
          {playlist && (
            <div class="playlist-info">
              <img 
                src={playlistImage || '/default-playlist.png'} 
                alt={playlist.name} 
                class="playlist-cover" 
              />
              <h3>{playlist.name}</h3>
              <p>{playlist.tracks.length} tracks</p>
            </div>
          )}
          <a href="/select-destination" class="choose-destination-button">
            Choose Destination
          </a>
        </div>
      )}
    </>
  );
}