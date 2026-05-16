import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { PlaylistState } from '../state/playlistState';
import { AppleMusicService } from '../services/AppleMusic';
import { SpotifyService } from '../services/spotify';
import '../styles/ConversionProgress.css';

type Phase = 'creating' | 'searching' | 'adding' | 'complete' | 'error';

export function ConversionProgressCard() {
  const [playlist] = useState(PlaylistState.getSourcePlaylist());
  const [convertedTracks, setConvertedTracks] = useState<Array<{
    name: string;
    artist: string;
    success: boolean;
  }>>([]);
  const [phase, setPhase] = useState<Phase>('creating');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Preparing your playlist…');
  const [progress, setProgress] = useState<number>(0);
  const [searchedTracks, setSearchedTracks] = useState<number>(0);
  const [searchingTrack, setSearchingTrack] = useState<string>('');

  useEffect(() => {
    const convertPlaylist = async () => {
      if (!playlist || !playlist.tracks) return;

      const destinationPlatform = PlaylistState.getDestinationPlatform();
      const destinationPlaylistId = PlaylistState.getDestinationPlaylistId();

      if (!destinationPlaylistId || !destinationPlatform) {
        setError('Missing destination information');
        setPhase('error');
        return;
      }

      const onProgress = (
        statusMsg: string,
        pct: number,
        callbackPhase: 'searching' | 'adding' | 'complete',
        currentTrack?: any
      ) => {
        setStatus(statusMsg);
        setProgress(pct);
        setPhase(callbackPhase === 'complete' ? 'complete' : callbackPhase);

        if (callbackPhase === 'searching') {
          setSearchingTrack(
            currentTrack ? `${currentTrack.name} — ${currentTrack.artists[0].name}` : ''
          );
          setSearchedTracks(prev => prev + 1);
        } else {
          const newTracks = currentTrack
            ? [{
                name: currentTrack.name,
                artist: Array.isArray(currentTrack.artists)
                  ? currentTrack.artists[0].name
                  : currentTrack.artists,
                success: true,
              }]
            : [];
          setConvertedTracks(prev => [...prev, ...newTracks]);
        }
      };

      try {
        if (destinationPlatform === 'apple') {
          await AppleMusicService.getInstance().addTracksToPlaylist(
            destinationPlaylistId,
            playlist.tracks,
            onProgress
          );
        } else if (destinationPlatform === 'spotify') {
          await SpotifyService.addTracksToPlaylist(
            destinationPlaylistId,
            playlist.tracks,
            onProgress
          );
        }
        setProgress(100);
        setPhase('complete');
        setStatus('Playlist conversion complete!');
      } catch (err) {
        console.error('Conversion error:', err);
        setError('Failed to convert some tracks');
        setPhase('error');
      }
    };

    convertPlaylist();
  }, [playlist]);

  const total = playlist?.tracks.length || 0;
  const phaseLabel = (() => {
    switch (phase) {
      case 'creating': return 'Preparing';
      case 'searching': return 'Searching';
      case 'adding': return 'Adding';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
    }
  })();

  return (
    <div class="conversion-container">
      <div class="conversion-header">
        <h1>Converting Playlist</h1>
        <div class="conversion-subtitle">
          {playlist?.name ? `"${playlist.name}"` : ''}
        </div>
      </div>

      <div class="conversion-status-card">
        <div class="conversion-phase">
          <span class="phase-label">{phaseLabel}</span>
          <span class="phase-count">
            {phase === 'searching' && total > 0
              ? `${searchedTracks} / ${total}`
              : phase === 'complete'
              ? `${convertedTracks.length} / ${total}`
              : ''}
          </span>
        </div>

        <div class="conversion-bar-track">
          <div
            class={`conversion-bar-fill ${phase === 'complete' ? 'complete' : ''}`}
            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
          ></div>
        </div>

        <div class="conversion-status-text">{status}</div>
        {phase === 'searching' && searchingTrack && (
          <div class="searching-track">{searchingTrack}</div>
        )}
      </div>

      {convertedTracks.length > 0 && (
        <div class="tracks-list">
          {convertedTracks.slice().reverse().map((track, index) => (
            <div class="track-item" key={index}>
              <i class={`fas ${track.success ? 'fa-check' : 'fa-times'}`} />
              <span>{track.name} — {track.artist}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div class="error-message">
          {error}
        </div>
      )}
    </div>
  );
}
