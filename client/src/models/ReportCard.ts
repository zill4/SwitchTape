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

export interface MusicAnalysisInput {
    genreBreakdown: Record<string, number>;
    eraMap: Record<string, number>;
    averagePopularity: number;
    topArtists: Array<{ name: string; count: number; genres: string[] }>;
    trackCount: number;
    uniqueArtistCount: number;
    uniqueGenreCount: number;
    popularityDistribution: {
        underground: number;
        indie: number;
        mainstream: number;
        mega: number;
    };
    oldestTrackYear: number;
    newestTrackYear: number;
    decadeSpan: number;
}

export interface MusicReportCard {
    listenerType: {
        name: string;
        tagline: string;
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
    deepCutAnalysis: string[];
    compatibility: {
        mostCompatible: string;
        leastCompatible: string;
        celebrityMatch: string;
    };
}
