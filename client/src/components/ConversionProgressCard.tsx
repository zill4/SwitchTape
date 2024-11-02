import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { PlaylistState } from '../state/playlistState';
import '../styles/ConversionProgress.css';

export function ConversionProgressCard() {
  const [playlist, setPlaylist] = useState(PlaylistState.getSourcePlaylist());
  const [convertedTracks, setConvertedTracks] = useState<Array<{
    name: string;
    artist: string;
    success: boolean;
  }>>([]);

  useEffect(() => {
    // Simulate conversion progress
    if (playlist && playlist.tracks) {
      const tracks = playlist.tracks.map(track => ({
        name: track.name,
        artist: Array.isArray(track.artists) ? track.artists[0].name : track.artists,
        success: true // In real implementation, this would be based on actual conversion success
      }));
      setConvertedTracks(tracks);
    }
  }, [playlist]);

  const handleSavePlaylist = () => {
    // Redirect to signup/login flow
    window.location.href = '/signup';
  };

  return (
    <div class="conversion-container">
      <h1>Converting Playlist</h1>
      <div class="conversion-status">
        SUCCESSFULLY CONVERTED: {convertedTracks.length}/{playlist?.tracks.length || 0}
      </div>

      <div class="tracks-list">
        {convertedTracks.map((track, index) => (
          <div class="track-item" key={index}>
            <i class="fas fa-check" />
            <span>{track.name} - {track.artist}</span>
          </div>
        ))}
      </div>

      <button class="save-button" onClick={handleSavePlaylist}>
        SAVE PLAYLIST
      </button>
    </div>
  );
}