// LoadPlaylistCard.tsx - Preact Component
import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { SpotifyService } from '../services/spotify';
import { PlaylistState } from '../state/playlistState';
import type { Playlist } from '../models/Playlist';
import type { SpotifyPlaylist } from '../models/SpotifyPlaylist';
import './LoadPlaylist.css';

export function LoadPlaylistCard() {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist | SpotifyPlaylist | null>(null);
  const [playlistImage, setPlaylistImage] = useState<string>('');
  const [showPlaylistView, setShowPlaylistView] = useState(false);
  
  const urlInputRef = useRef<HTMLInputElement>(null);
  const playlistCardRef = useRef<HTMLDivElement>(null);

  const extractPlaylistIdFromUrl = (url: string): string | null => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // TODO: Handle both Spotify and Apple Music playlists
  const handleLoadPlaylist = async () => {
    if (!urlInputRef.current) return;

    const url = urlInputRef.current.value.trim();
    const playlistId = extractPlaylistIdFromUrl(url);

    if (!playlistId) {
      setError('Invalid playlist URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const loadedPlaylist = await SpotifyService.getPlaylist(playlistId);
      PlaylistState.setSourcePlaylist(loadedPlaylist);
      setPlaylist(loadedPlaylist);
      setPlaylistImage(loadedPlaylist.images ? loadedPlaylist.images[0].url : '');
      setShowPlaylistView(true); // Show playlist view after successful load
    } catch (error) {
      setError('Failed to load playlist');
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
            placeholder="Paste playlist URL here"
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
          <h2>From Your Spotify Account</h2>
          <div class="account-row">
            <div class="account-info">
              <img src="/spotify-icon.svg" alt="Spotify" class="platform-icon" />
              <span>My Spotify Music Library</span>
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