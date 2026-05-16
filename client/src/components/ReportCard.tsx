import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { SpotifyService } from '../services/spotify';
import { MusicAnalyzer } from '../services/MusicAnalyzer';
import type { MusicReportCard as ReportCardType } from '../models/ReportCard';
import '../styles/ReportCard.css';

const CACHE_KEY = 'music_report_card';

export function ReportCard() {
    const [phase, setPhase] = useState<'connect' | 'loading' | 'report' | 'error'>('connect');
    const [report, setReport] = useState<ReportCardType | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                setReport(JSON.parse(cached));
                setPhase('report');
            } catch {
                localStorage.removeItem(CACHE_KEY);
            }
        }
    }, []);

    const hasSpotifyToken = () => {
        const token = localStorage.getItem('spotify_access_token');
        const expiry = localStorage.getItem('spotify_token_expiry');
        return token && expiry && Date.now() < parseInt(expiry);
    };

    const generateReport = async () => {
        setPhase('loading');

        try {
            if (!hasSpotifyToken()) {
                setLoadingMessage('Connecting to Spotify...');
                await SpotifyService.authorize();
            }

            setLoadingMessage('Fetching your top tracks...');
            const [topTracks, topArtists] = await Promise.all([
                SpotifyService.getTopTracks('long_term'),
                SpotifyService.getTopArtists('long_term'),
            ]);

            if (topTracks.length < 5) {
                setErrorMessage('Not enough listening history yet. Listen to more music on Spotify and try again.');
                setPhase('error');
                return;
            }

            setLoadingMessage('Analyzing your music taste...');
            const analysisInput = MusicAnalyzer.analyze(topTracks, topArtists);

            setLoadingMessage('Generating your report card...');
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisInput }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate report');
            }
            const { report: reportData } = await response.json() as { report: ReportCardType };

            localStorage.setItem(CACHE_KEY, JSON.stringify(reportData));
            setReport(reportData);
            setPhase('report');
        } catch (err: any) {
            console.error('Report generation failed:', err);
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
            setPhase('error');
        }
    };

    const handleRegenerate = () => {
        localStorage.removeItem(CACHE_KEY);
        setReport(null);
        generateReport();
    };

    const handleShare = async () => {
        if (!reportRef.current) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
                scale: 2,
                useCORS: true,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                if (navigator.share && navigator.canShare) {
                    const file = new File([blob], 'switchtape-report.png', { type: 'image/png' });
                    const shareData = { files: [file], title: 'My SwitchTape Music Report Card' };

                    if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                        return;
                    }
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'switchtape-report.png';
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/png');
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    if (phase === 'connect') {
        return (
            <div class="report-container">
                <div class="report-header">
                    <h1>Music Report Card</h1>
                    <div class="report-subtitle">
                        <i class="fa-brands fa-spotify"></i> Powered by your Spotify listening history
                    </div>
                </div>
                <div class="report-card connect-card">
                    <h2>Discover Your Music DNA</h2>
                    <p>
                        Connect your Spotify account and we'll analyze your top tracks
                        and artists to generate a personalized music personality report.
                    </p>
                    <button class="connect-btn" onClick={generateReport}>
                        <i class="fa-brands fa-spotify"></i>
                        Connect Spotify
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'loading') {
        return (
            <div class="report-container">
                <div class="report-header">
                    <h1>Music Report Card</h1>
                </div>
                <div class="report-card loading-card">
                    <div class="loading-spinner"></div>
                    <div class="loading-message">{loadingMessage}</div>
                </div>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div class="report-container">
                <div class="report-header">
                    <h1>Music Report Card</h1>
                </div>
                <div class="report-card error-card">
                    <p>{errorMessage}</p>
                    <button class="retry-btn" onClick={generateReport}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!report) return null;

    const maxEra = Math.max(...report.eraMap.map(e => e.percentage));

    return (
        <div class="report-container">
            <div class="report-header">
                <h1>Music Report Card</h1>
                <div class="report-subtitle">
                    <i class="fa-brands fa-spotify"></i> Based on your all-time top songs
                </div>
            </div>

            <div ref={reportRef}>
                {/* LISTENER TYPE */}
                <div class="report-card type-card">
                    <div class="card-label">Your Listener Type</div>
                    <div class="type-name">{report.listenerType.name}</div>
                    <div class="type-tagline">{report.listenerType.tagline}</div>
                </div>

                {/* BIG FIVE — PSYCHOLOGY GROUNDING */}
                {report.bigFive && (
                    <div class="report-card">
                        <div class="card-label">Big Five Personality (OCEAN)</div>
                        {[
                            { key: 'openness', label: 'Openness' },
                            { key: 'conscientiousness', label: 'Conscientiousness' },
                            { key: 'extraversion', label: 'Extraversion' },
                            { key: 'agreeableness', label: 'Agreeableness' },
                            { key: 'neuroticism', label: 'Neuroticism' },
                        ].map((trait, i) => {
                            const value = (report.bigFive as any)[trait.key] as number;
                            return (
                                <div class="bigfive-row" key={trait.key}>
                                    <div class="bigfive-label">{trait.label}</div>
                                    <div class="bigfive-bar-track">
                                        <div
                                            class={`bigfive-bar-fill ${i % 2 === 0 ? 'accent' : ''}`}
                                            style={{ width: `${value}%` }}
                                        ></div>
                                    </div>
                                    <div class="bigfive-pct">{value}</div>
                                </div>
                            );
                        })}
                        {report.bigFive.summary && (
                            <p class="bigfive-blurb">{report.bigFive.summary}</p>
                        )}
                    </div>
                )}

                {/* MBTI + COLOR AURA */}
                {(report.mbtiVibe || report.colorAura) && (
                    <div class="facet-grid">
                        {report.mbtiVibe && (
                            <div class="facet-cell">
                                <div class="facet-label">MBTI Vibe</div>
                                <div class="facet-value">{report.mbtiVibe.type}</div>
                                <div class="facet-desc">{report.mbtiVibe.description}</div>
                            </div>
                        )}
                        {report.colorAura && (
                            <div class="facet-cell">
                                <div class="facet-label">Color Aura</div>
                                <div class="facet-value">
                                    <span
                                        class="color-swatch"
                                        style={{ background: report.colorAura.hex }}
                                    ></span>
                                    {report.colorAura.name}
                                </div>
                                <div class="facet-desc">{report.colorAura.meaning}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* KEY METRICS */}
                <div class="stats-wrapper">
                    <div class="card-label">Key Metrics</div>
                    <div class="stats-grid">
                        {Object.entries(report.metrics).map(([key, value], i) => (
                            <div class="stat-cell" key={key}>
                                <div class={`stat-value ${i % 2 === 1 ? 'red' : ''}`}>{value}</div>
                                <div class="stat-label">{key}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div class="section-divider"></div>

                {/* GENRE DNA */}
                <div class="report-card">
                    <div class="card-label">Genre DNA</div>
                    {report.genreDNA.map((item, i) => (
                        <div class="genre-row" key={item.genre}>
                            <div class="genre-label">{item.genre}</div>
                            <div class="genre-bar-track">
                                <div
                                    class={`genre-bar-fill ${i === 0 ? 'accent' : ''}`}
                                    style={{ width: `${item.percentage}%` }}
                                ></div>
                            </div>
                            <div class="genre-pct">{item.percentage}%</div>
                        </div>
                    ))}
                </div>

                {/* ERA MAP */}
                <div class="report-card">
                    <div class="card-label">Era Map</div>
                    {report.eraMap.map((item) => (
                        <div class="era-row" key={item.decade}>
                            <div class="era-label">'{item.decade.replace(/^\d{2}/, '').replace('s', 's')}</div>
                            <div class="era-bar-track">
                                <div
                                    class={`era-bar-fill ${item.percentage === maxEra ? 'highlight' : ''}`}
                                    style={{ width: `${item.percentage}%` }}
                                ></div>
                            </div>
                            <div class="era-pct">{item.percentage}%</div>
                        </div>
                    ))}
                </div>

                {/* PERSONALITY SPECTRUM */}
                <div class="report-card">
                    <div class="card-label">Personality Spectrum</div>
                    {report.personalitySpectrum.map((trait, i) => (
                        <div class="trait-row" key={i}>
                            <div class="trait-label-left">{trait.leftLabel}</div>
                            <div class="trait-bar-track">
                                <div
                                    class={`trait-bar-fill ${i % 2 === 0 ? 'red' : ''}`}
                                    style={{ width: `${trait.value}%` }}
                                ></div>
                            </div>
                            <div class="trait-label-right">{trait.rightLabel}</div>
                        </div>
                    ))}
                </div>

                {/* VIBE CHECK */}
                <div class="report-card">
                    <div class="card-label">Vibe Check</div>
                    <div class="vibe-tags">
                        {report.vibeTags.map((tag, i) => (
                            <span
                                class={`vibe-tag ${i % 5 === 0 ? 'red' : i % 3 === 0 ? 'filled' : ''}`}
                                key={i}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* TOP ARTISTS */}
                <div class="stats-wrapper">
                    <div class="card-label">Top Artists Detected</div>
                    <div class="artist-grid">
                        {report.topArtists.slice(0, 8).map((artist, i) => (
                            <div class={`artist-cell ${i < 3 ? 'top' : ''}`} key={artist.name}>
                                <span class="artist-name">{artist.name}</span>
                                <span class="artist-count">
                                    {artist.count} {artist.count === 1 ? 'track' : 'tracks'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RECOMMENDED ARTISTS */}
                {report.recommendedArtists && report.recommendedArtists.length > 0 && (
                    <div class="report-card">
                        <div class="card-label">You'd Probably Like</div>
                        <div class="rec-list">
                            {report.recommendedArtists.map((rec) => (
                                <div class="rec-item" key={rec.name}>
                                    <div class="rec-name">{rec.name}</div>
                                    <div class="rec-reason">{rec.reason}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div class="section-divider"></div>

                {/* DEEP CUT ANALYSIS */}
                <div class="report-card">
                    <div class="card-label">The Deep Cut</div>
                    {report.deepCutAnalysis.map((paragraph, i) => (
                        <p class="analysis-text" key={i} dangerouslySetInnerHTML={{
                            __html: paragraph.replace(
                                /\*\*(.*?)\*\*/g,
                                '<strong>$1</strong>'
                            )
                        }}></p>
                    ))}
                </div>

                {/* COMPATIBILITY */}
                <div class="report-card">
                    <div class="card-label">Listener Compatibility</div>
                    <div class="compat-row">
                        <strong>Most compatible with: </strong>{report.compatibility.mostCompatible}
                    </div>
                    <div class="compat-row">
                        <strong>Least compatible with: </strong>{report.compatibility.leastCompatible}
                    </div>
                    <div class="compat-row">
                        <strong>Celebrity match: </strong>{report.compatibility.celebrityMatch}
                    </div>
                </div>

                {/* COSMIC VIBE */}
                {report.cosmicVibe && (
                    <div class="report-card cosmic-card">
                        <div class="card-label">Cosmic Vibe</div>
                        <div class="cosmic-sign">{report.cosmicVibe.sign}</div>
                        <div class="cosmic-reading">{report.cosmicVibe.reading}</div>
                        <div class="cosmic-disclaimer">For fun — not science</div>
                    </div>
                )}
            </div>

            {/* ACTIONS */}
            <div class="report-actions">
                <button class="btn btn-primary" onClick={handleShare}>
                    <i class="fa-solid fa-share-nodes"></i>&nbsp; Share Report
                </button>
                <button class="btn btn-secondary" onClick={handleRegenerate}>
                    <i class="fa-solid fa-arrows-rotate"></i>&nbsp; Regenerate
                </button>
            </div>
        </div>
    );
}
