export interface SpotifyTopTrack {
    id: string;
    name: string;
    popularity: number;
    artists: Array<{ id: string; name: string }>;
    album: {
        id: string;
        name: string;
        release_date: string;
        images: Array<{ url: string; width: number; height: number }>;
    };
}

export interface SpotifyTopArtist {
    id: string;
    name: string;
    genres: string[];
    popularity: number;
    images: Array<{ url: string; width: number; height: number }>;
}

interface BaseAnalysisInput {
    genreBreakdown: Record<string, number>;
    eraMap: Record<string, number>;
    topArtists: Array<{ name: string; count: number; genres: string[] }>;
    trackCount: number;
    uniqueArtistCount: number;
    uniqueGenreCount: number;
    oldestTrackYear: number;
    newestTrackYear: number;
    decadeSpan: number;
}

export interface SpotifyAnalysisInput extends BaseAnalysisInput {
    source: 'spotify';
    /** "long_term" top tracks/artists from Spotify — strong all-time taste signal */
    signalNote: string;
    averagePopularity: number;
    popularityDistribution: {
        underground: number;
        indie: number;
        mainstream: number;
        mega: number;
    };
}

export interface AppleAnalysisInput extends BaseAnalysisInput {
    source: 'apple';
    /** Composite signal: heavy rotation + recently played + Apple's recommendations */
    signalNote: string;
    /** Artists/albums Apple's algorithm is recommending — proxy for adjacent taste */
    appleRecommendations: Array<{ name: string; artistName?: string; type: string }>;
    /** Items in heavy rotation — most-played albums/playlists */
    heavyRotation: Array<{ name: string; artistName?: string; type: string }>;
    /** Recent listening sample size */
    recentlyPlayedCount: number;
}

export type MusicAnalysisInput = SpotifyAnalysisInput | AppleAnalysisInput;

export interface MusicReportCard {
    listenerType: {
        name: string;
        tagline: string;
    };
    bigFive: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
        summary: string;
    };
    mbtiVibe: {
        type: string;
        description: string;
    };
    colorAura: {
        name: string;
        hex: string;
        meaning: string;
    };
    metrics: {
        nostalgia: number;
        energy: number;
        depth: number;
        range: number;
        mainstream: number;
        replay: number;
    };
    genreDNA: Array<{ genre: string; percentage: number }>;
    eraMap: Array<{ decade: string; percentage: number }>;
    personalitySpectrum: Array<{
        leftLabel: string;
        rightLabel: string;
        value: number;
    }>;
    vibeTags: string[];
    topArtists: Array<{ name: string; count: number }>;
    recommendedArtists: Array<{ name: string; reason: string }>;
    deepCutAnalysis: string[];
    compatibility: {
        mostCompatible: string;
        leastCompatible: string;
        celebrityMatch: string;
    };
    cosmicVibe: {
        sign: string;
        reading: string;
    };
}
