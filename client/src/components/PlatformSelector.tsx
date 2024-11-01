import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { PlaylistState } from '../state/playlistState';
import { AppleMusicService } from '../services/AppleMusic';
import type { GenericTrack } from '../models/Playlist';
import './SelectDestination.css';
import type { Playlist } from '../models/Playlist';
import type { SpotifyPlaylist } from '../models/SpotifyPlaylist';

interface Platform {
  id: string;
  name: string;
  icon: string;
  isSource: boolean;
}

interface ConversionProgress {
  converted: number;
  total: number;
  tracks: { name: string; artist: string; success: boolean; }[];
}

export function PlatformSelector({ sourcePlatform = 'spotify' }) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [sourcePlaylist, setSourcePlaylist] = useState<Playlist | SpotifyPlaylist | null>(null);

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = PlaylistState.subscribe(() => {
      setSourcePlaylist(PlaylistState.getSourcePlaylist());
    });

    // Check if there's already a playlist in state
    const existingPlaylist = PlaylistState.getSourcePlaylist();
    if (existingPlaylist) {
      setSourcePlaylist(existingPlaylist);
    } else {
      // Redirect if no playlist is selected
      window.location.href = '/load-playlist';
    }

    return () => unsubscribe();
  }, []);

  const platforms: Platform[] = [
    { id: 'spotify', name: 'Spotify', icon: 'fab fa-spotify', isSource: sourcePlatform === 'spotify' },
    { id: 'apple', name: 'Apple Music', icon: 'fab fa-apple', isSource: sourcePlatform === 'apple' },
    { id: 'youtube', name: 'YouTube', icon: 'fab fa-youtube', isSource: sourcePlatform === 'youtube' },
    { id: 'deezer', name: 'Deezer', icon: 'fas fa-music', isSource: sourcePlatform === 'deezer' },
    { id: 'tidal', name: 'Tidal', icon: 'fas fa-wave-square', isSource: sourcePlatform === 'tidal' },
    { id: 'amazon', name: 'Amazon Music', icon: 'fab fa-amazon', isSource: sourcePlatform === 'amazon' },
    { id: 'soundcloud', name: 'SoundCloud', icon: 'fab fa-soundcloud', isSource: sourcePlatform === 'soundcloud' },
  ];

  const handlePlatformSelect = async (platformId: string) => {
    if (platformId === 'apple') {
      try {
        const appleMusic = AppleMusicService.getInstance();
        await appleMusic.authorize();
        setSelectedPlatform(platformId);
        PlaylistState.setDestination(platformId);
      } catch (error) {
        setError('Failed to authorize Apple Music');
      }
    }
  };

  const handleConversion = async () => {
    if (!sourcePlaylist) {
      setError('No playlist selected');
      return;
    }

    setIsConverting(true);
    setProgress({ converted: 0, total: sourcePlaylist.tracks.length, tracks: [] });

    try {
      const appleMusic = AppleMusicService.getInstance();
      const playlistId = await appleMusic.createPlaylist(
        sourcePlaylist.name, 
        'description' in sourcePlaylist ? sourcePlaylist.description : ''
      );

      for (const track of sourcePlaylist.tracks) {
        const trackId = await appleMusic.searchTrack(track);
        setProgress(prev => {
          if (!prev) return null;
          return {
            ...prev,
            converted: trackId ? prev.converted + 1 : prev.converted,
            tracks: [...prev.tracks, {
              name: track.name,
              artist: track.artists[0].name,
              success: !!trackId
            }]
          };
        });
      }

      await appleMusic.addTracksToPlaylist(playlistId, sourcePlaylist.tracks);
    } catch (error) {
      setError('Failed to convert playlist');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      <div class="search-container">
        <i class="fas fa-search search-icon" />
        <input 
          type="text" 
          placeholder="Search a platform" 
          class="search-input"
        />
      </div>

      <div class="platforms-grid">
        {platforms.map(platform => (
          <button 
            class={`platform-card ${platform.isSource ? 'source' : ''} ${selectedPlatform === platform.id ? 'selected' : ''}`}
            onClick={() => handlePlatformSelect(platform.id)}
            disabled={platform.isSource}
          >
            {platform.isSource && <span class="source-badge">Source</span>}
            <i class={platform.icon} />
            <span class="platform-name">{platform.name}</span>
          </button>
        ))}
      </div>

      {selectedPlatform && !isConverting && (
        <button 
          class="next-button" 
          onClick={handleConversion}
        >
          Convert Playlist
        </button>
      )}

      {progress && (
        <div class="conversion-progress">
          <h3>Converting Playlist</h3>
          <div class="progress-header">
            <span>Successfully converted: {progress.converted}/{progress.total}</span>
          </div>
          <div class="progress-list">
            {progress.tracks.map(track => (
              <div class="progress-item">
                <i class={`fas ${track.success ? 'fa-check success' : 'fa-times failure'}`} />
                <span>{track.name} - {track.artist}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div class="error" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
  );
}