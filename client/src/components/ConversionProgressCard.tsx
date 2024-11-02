import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { PlaylistState } from '../state/playlistState';
import { AppleMusicService } from '../services/AppleMusic';
import '../styles/ConversionProgress.css';

export function ConversionProgressCard() {
  const [playlist, setPlaylist] = useState(PlaylistState.getSourcePlaylist());
  const [convertedTracks, setConvertedTracks] = useState<Array<{
    name: string;
    artist: string;
    success: boolean;
  }>>([]);
  const [isConverting, setIsConverting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [searchedTracks, setSearchedTracks] = useState<number>(0);
  const [searchingTrack, setSearchingTrack] = useState<string>('');

  useEffect(() => {
    const convertPlaylist = async () => {
      if (!playlist || !playlist.tracks) return;

      const appleMusic = AppleMusicService.getInstance();
      const destinationPlaylistId = PlaylistState.getDestinationPlaylistId();
      
      if (!destinationPlaylistId) {
        setError('No destination playlist ID found');
        return;
      }

      const processedTracks: typeof convertedTracks = [];
      
      try {
        setStatus('Creating playlist...');
        await appleMusic.addTracksToPlaylist(
          destinationPlaylistId,
          playlist.tracks,
          (status, progress, phase, currentTrack) => {
            setStatus(status);
            setProgress(progress);
            if (phase === 'searching') {
              setSearchingTrack(currentTrack ? `${currentTrack.name} - ${currentTrack.artists[0].name}` : '');
              setSearchedTracks(prev => prev + 1);
            } else {
              const newTracks = currentTrack ? [{
                name: currentTrack.name,
                artist: Array.isArray(currentTrack.artists) ? currentTrack.artists[0].name : currentTrack.artists,
                success: true
              }] : [];
              setConvertedTracks(prev => [...prev, ...newTracks]);
            }
          }
        );
      } catch (error) {
        console.error('Conversion error:', error);
        setError('Failed to convert some tracks');
      } finally {
        setIsConverting(false);
      }
    };

    convertPlaylist();
  }, [playlist]);

  const handleSavePlaylist = () => {
    window.location.href = '/signup';
  };

  return (
    <div class="conversion-container">
      <h1>Converting Playlist</h1>
      <div class="conversion-status">
        {searchedTracks < (playlist?.tracks.length || 0) ? (
          <div>
            SEARCHING TRACKS: {searchedTracks}/{playlist?.tracks.length || 0}
            {searchingTrack && <div class="searching-track">Searching: {searchingTrack}</div>}
          </div>
        ) : (
          <div>
            SUCCESSFULLY CONVERTED: {convertedTracks.length}/{playlist?.tracks.length || 0}
          </div>
        )}
      </div>

      <div class="tracks-list">
        {convertedTracks.map((track, index) => (
          <div class="track-item" key={index}>
            <i class={`fas ${track.success ? 'fa-check' : 'fa-times'}`} />
            <span>{track.name} - {track.artist}</span>
          </div>
        ))}
      </div>

      {!isConverting && !error && (
        <button class="save-button" onClick={handleSavePlaylist}>
          SAVE PLAYLIST
        </button>
      )}

      {error && (
        <div class="error-message">
          {error}
        </div>
      )}
    </div>
  );
}