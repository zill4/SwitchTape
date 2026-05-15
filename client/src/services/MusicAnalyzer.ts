import type { SpotifyTopTrack, SpotifyTopArtist, MusicAnalysisInput } from "../models/ReportCard";

export class MusicAnalyzer {
    static analyze(topTracks: SpotifyTopTrack[], topArtists: SpotifyTopArtist[]): MusicAnalysisInput {
        const genreBreakdown = this.computeGenreBreakdown(topArtists);
        const eraMap = this.computeEraMap(topTracks);
        const averagePopularity = this.computeAveragePopularity(topTracks);
        const artistFrequency = this.computeArtistFrequency(topTracks, topArtists);
        const popularityDistribution = this.computePopularityDistribution(topTracks);
        const years = topTracks
            .map(t => this.extractYear(t.album.release_date))
            .filter(y => y > 0);

        const uniqueArtistIds = new Set(topTracks.flatMap(t => t.artists.map(a => a.id)));
        const allGenres = new Set(topArtists.flatMap(a => a.genres));

        return {
            genreBreakdown,
            eraMap,
            averagePopularity,
            topArtists: artistFrequency,
            trackCount: topTracks.length,
            uniqueArtistCount: uniqueArtistIds.size,
            uniqueGenreCount: allGenres.size,
            popularityDistribution,
            oldestTrackYear: years.length > 0 ? Math.min(...years) : 0,
            newestTrackYear: years.length > 0 ? Math.max(...years) : 0,
            decadeSpan: years.length > 0
                ? Math.floor(Math.max(...years) / 10) - Math.floor(Math.min(...years) / 10) + 1
                : 0,
        };
    }

    private static computeGenreBreakdown(topArtists: SpotifyTopArtist[]): Record<string, number> {
        const genreCounts: Record<string, number> = {};
        let total = 0;

        for (const artist of topArtists) {
            for (const genre of artist.genres) {
                const normalized = this.normalizeGenre(genre);
                genreCounts[normalized] = (genreCounts[normalized] || 0) + 1;
                total++;
            }
        }

        if (total === 0) return {};

        const breakdown: Record<string, number> = {};
        let otherPct = 0;

        for (const [genre, count] of Object.entries(genreCounts)) {
            const pct = Math.round((count / total) * 100);
            if (pct < 3) {
                otherPct += pct;
            } else {
                breakdown[genre] = pct;
            }
        }

        if (otherPct > 0) {
            breakdown['Other'] = otherPct;
        }

        return breakdown;
    }

    private static normalizeGenre(genre: string): string {
        const mappings: Record<string, string> = {
            'pop punk': 'Pop-Punk',
            'punk': 'Punk',
            'emo': 'Emo',
            'emo rap': 'Emo Rap',
            'hip hop': 'Hip-Hop',
            'rap': 'Hip-Hop',
            'trap': 'Hip-Hop',
            'southern hip hop': 'Hip-Hop',
            'east coast hip hop': 'Hip-Hop',
            'west coast hip hop': 'Hip-Hop',
            'gangster rap': 'Hip-Hop',
            'conscious hip hop': 'Hip-Hop',
            'alternative rock': 'Alternative',
            'indie rock': 'Indie',
            'indie pop': 'Indie',
            'modern rock': 'Alternative',
            'rock': 'Rock',
            'classic rock': 'Classic Rock',
            'new wave': 'New Wave',
            'synthpop': 'Synthpop',
            'post-punk': 'Post-Punk',
            'r&b': 'R&B',
            'soul': 'R&B',
            'pop': 'Pop',
            'dance pop': 'Pop',
            'electropop': 'Pop',
            'country': 'Country',
            'folk': 'Folk',
            'metal': 'Metal',
            'hardcore': 'Hardcore',
            'jazz': 'Jazz',
            'latin': 'Latin',
            'reggaeton': 'Latin',
            'edm': 'Electronic',
            'electronic': 'Electronic',
            'house': 'Electronic',
            'techno': 'Electronic',
        };

        const lower = genre.toLowerCase();
        for (const [key, value] of Object.entries(mappings)) {
            if (lower.includes(key)) return value;
        }
        return genre.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    private static computeEraMap(topTracks: SpotifyTopTrack[]): Record<string, number> {
        const decadeCounts: Record<string, number> = {};
        let total = 0;

        for (const track of topTracks) {
            const year = this.extractYear(track.album.release_date);
            if (year <= 0) continue;

            const decadeStart = Math.floor(year / 10) * 10;
            const label = `${decadeStart}s`;
            decadeCounts[label] = (decadeCounts[label] || 0) + 1;
            total++;
        }

        if (total === 0) return {};

        const eraMap: Record<string, number> = {};
        const sortedDecades = Object.keys(decadeCounts).sort();
        for (const decade of sortedDecades) {
            eraMap[decade] = Math.round((decadeCounts[decade] / total) * 100);
        }

        return eraMap;
    }

    private static computeAveragePopularity(topTracks: SpotifyTopTrack[]): number {
        if (topTracks.length === 0) return 0;
        const sum = topTracks.reduce((acc, t) => acc + t.popularity, 0);
        return Math.round(sum / topTracks.length);
    }

    private static computePopularityDistribution(topTracks: SpotifyTopTrack[]) {
        const dist = { underground: 0, indie: 0, mainstream: 0, mega: 0 };
        if (topTracks.length === 0) return dist;

        for (const track of topTracks) {
            if (track.popularity <= 25) dist.underground++;
            else if (track.popularity <= 50) dist.indie++;
            else if (track.popularity <= 75) dist.mainstream++;
            else dist.mega++;
        }

        const total = topTracks.length;
        return {
            underground: Math.round((dist.underground / total) * 100),
            indie: Math.round((dist.indie / total) * 100),
            mainstream: Math.round((dist.mainstream / total) * 100),
            mega: Math.round((dist.mega / total) * 100),
        };
    }

    private static computeArtistFrequency(
        topTracks: SpotifyTopTrack[],
        topArtists: SpotifyTopArtist[]
    ): Array<{ name: string; count: number; genres: string[] }> {
        const artistCounts: Record<string, { count: number; genres: string[] }> = {};
        const artistGenreMap = new Map(topArtists.map(a => [a.id, a.genres]));

        for (const track of topTracks) {
            for (const artist of track.artists) {
                if (!artistCounts[artist.name]) {
                    artistCounts[artist.name] = {
                        count: 0,
                        genres: artistGenreMap.get(artist.id) || [],
                    };
                }
                artistCounts[artist.name].count++;
            }
        }

        return Object.entries(artistCounts)
            .map(([name, data]) => ({ name, count: data.count, genres: data.genres }))
            .sort((a, b) => b.count - a.count);
    }

    private static extractYear(releaseDate: string): number {
        if (!releaseDate) return 0;
        const year = parseInt(releaseDate.substring(0, 4), 10);
        return isNaN(year) ? 0 : year;
    }
}
