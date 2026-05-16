import type {
    AppleHeavyRotationItem,
    AppleRecentTrack,
    AppleRecommendationItem,
} from './AppleMusic';
import type { AppleAnalysisInput } from '../models/ReportCard';

/**
 * Aggregates Apple Music's three signal sources into a MusicAnalysisInput.
 *
 * Apple doesn't expose an "all-time top tracks" endpoint like Spotify, so we
 * compose:
 *   - heavy rotation (most-played albums/playlists, weight = 3x)
 *   - recently played tracks (last ~30, weight = 1x)
 *   - Apple's personal recommendations (adjacent-taste signal, not own taste)
 *
 * Genres come straight from track/album genreNames (Apple returns these inline,
 * unlike Spotify which only attaches genres to artists).
 */
export class AppleMusicAnalyzer {
    static analyze(
        heavyRotation: AppleHeavyRotationItem[],
        recentlyPlayed: AppleRecentTrack[],
        recommendations: AppleRecommendationItem[]
    ): AppleAnalysisInput {
        const artistFrequency = this.computeArtistFrequency(heavyRotation, recentlyPlayed);
        const genreBreakdown = this.computeGenreBreakdown(heavyRotation, recentlyPlayed);
        const eraMap = this.computeEraMap(heavyRotation, recentlyPlayed);

        const allGenres = new Set<string>();
        for (const item of heavyRotation) item.genreNames.forEach(g => allGenres.add(g));
        for (const item of recentlyPlayed) item.genreNames.forEach(g => allGenres.add(g));

        const uniqueArtists = new Set<string>();
        for (const item of heavyRotation) if (item.artistName) uniqueArtists.add(item.artistName);
        for (const item of recentlyPlayed) if (item.artistName) uniqueArtists.add(item.artistName);

        const years = [
            ...heavyRotation.map(i => this.extractYear(i.releaseDate)),
            ...recentlyPlayed.map(t => this.extractYear(t.releaseDate)),
        ].filter(y => y > 0);

        return {
            source: 'apple',
            signalNote:
                'Apple Music composite signal: heavy rotation (most-played albums/playlists, ' +
                'strongest weight), recently played tracks (recency snapshot), and Apple\'s own ' +
                'algorithmic recommendations (adjacent-taste hint, not direct listening). This is ' +
                'NOT an all-time top list like Spotify\'s — calibrate confidence accordingly.',
            genreBreakdown,
            eraMap,
            topArtists: artistFrequency,
            trackCount: recentlyPlayed.length,
            uniqueArtistCount: uniqueArtists.size,
            uniqueGenreCount: allGenres.size,
            oldestTrackYear: years.length > 0 ? Math.min(...years) : 0,
            newestTrackYear: years.length > 0 ? Math.max(...years) : 0,
            decadeSpan:
                years.length > 0
                    ? Math.floor(Math.max(...years) / 10) - Math.floor(Math.min(...years) / 10) + 1
                    : 0,
            appleRecommendations: recommendations.slice(0, 20).map(r => ({
                name: r.name,
                artistName: r.artistName || undefined,
                type: r.type,
            })),
            heavyRotation: heavyRotation.map(h => ({
                name: h.name,
                artistName: h.artistName || undefined,
                type: h.type,
            })),
            recentlyPlayedCount: recentlyPlayed.length,
        };
    }

    private static computeArtistFrequency(
        heavyRotation: AppleHeavyRotationItem[],
        recentlyPlayed: AppleRecentTrack[]
    ): Array<{ name: string; count: number; genres: string[] }> {
        const artistData: Record<string, { count: number; genres: Set<string> }> = {};

        // Heavy rotation weighted 3x (signal that user listens to this artist most)
        for (const item of heavyRotation) {
            if (!item.artistName) continue;
            if (!artistData[item.artistName]) {
                artistData[item.artistName] = { count: 0, genres: new Set() };
            }
            artistData[item.artistName].count += 3;
            item.genreNames.forEach(g => artistData[item.artistName].genres.add(g));
        }

        for (const track of recentlyPlayed) {
            if (!track.artistName) continue;
            if (!artistData[track.artistName]) {
                artistData[track.artistName] = { count: 0, genres: new Set() };
            }
            artistData[track.artistName].count += 1;
            track.genreNames.forEach(g => artistData[track.artistName].genres.add(g));
        }

        return Object.entries(artistData)
            .map(([name, data]) => ({
                name,
                count: data.count,
                genres: Array.from(data.genres),
            }))
            .sort((a, b) => b.count - a.count);
    }

    private static computeGenreBreakdown(
        heavyRotation: AppleHeavyRotationItem[],
        recentlyPlayed: AppleRecentTrack[]
    ): Record<string, number> {
        const genreCounts: Record<string, number> = {};
        let total = 0;

        // Heavy rotation 3x weight
        for (const item of heavyRotation) {
            for (const g of item.genreNames) {
                const norm = this.normalizeGenre(g);
                genreCounts[norm] = (genreCounts[norm] || 0) + 3;
                total += 3;
            }
        }

        for (const track of recentlyPlayed) {
            for (const g of track.genreNames) {
                const norm = this.normalizeGenre(g);
                genreCounts[norm] = (genreCounts[norm] || 0) + 1;
                total += 1;
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

        if (otherPct > 0) breakdown['Other'] = otherPct;
        return breakdown;
    }

    private static normalizeGenre(genre: string): string {
        // Apple's genre format uses "/" separators like "Hip-Hop/Rap"
        const lower = genre.toLowerCase();
        const mappings: Record<string, string> = {
            'hip-hop/rap': 'Hip-Hop',
            'rap': 'Hip-Hop',
            'hip hop': 'Hip-Hop',
            'r&b/soul': 'R&B',
            'soul': 'R&B',
            'rock': 'Rock',
            'alternative': 'Alternative',
            'indie rock': 'Indie',
            'indie pop': 'Indie',
            'pop': 'Pop',
            'dance': 'Electronic',
            'electronic': 'Electronic',
            'house': 'Electronic',
            'techno': 'Electronic',
            'edm': 'Electronic',
            'country': 'Country',
            'jazz': 'Jazz',
            'classical': 'Classical',
            'metal': 'Metal',
            'hardcore': 'Hardcore',
            'punk': 'Punk',
            'emo': 'Emo',
            'reggaeton': 'Latin',
            'latin': 'Latin',
            'folk': 'Folk',
            'singer/songwriter': 'Singer-Songwriter',
        };

        for (const [key, value] of Object.entries(mappings)) {
            if (lower.includes(key)) return value;
        }

        // Default: title-case the first segment of "Genre/Subgenre"
        const first = genre.split('/')[0];
        return first
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    private static computeEraMap(
        heavyRotation: AppleHeavyRotationItem[],
        recentlyPlayed: AppleRecentTrack[]
    ): Record<string, number> {
        const decadeCounts: Record<string, number> = {};
        let total = 0;

        const addYear = (year: number, weight: number) => {
            if (year <= 0) return;
            const decadeStart = Math.floor(year / 10) * 10;
            const label = `${decadeStart}s`;
            decadeCounts[label] = (decadeCounts[label] || 0) + weight;
            total += weight;
        };

        for (const item of heavyRotation) addYear(this.extractYear(item.releaseDate), 3);
        for (const track of recentlyPlayed) addYear(this.extractYear(track.releaseDate), 1);

        if (total === 0) return {};

        const eraMap: Record<string, number> = {};
        const sortedDecades = Object.keys(decadeCounts).sort();
        for (const decade of sortedDecades) {
            eraMap[decade] = Math.round((decadeCounts[decade] / total) * 100);
        }

        return eraMap;
    }

    private static extractYear(releaseDate: string): number {
        if (!releaseDate) return 0;
        const year = parseInt(releaseDate.substring(0, 4), 10);
        return isNaN(year) ? 0 : year;
    }
}
