import { getFunctions, httpsCallable } from 'firebase/functions';

export class AppleMusicService {
    private static instance: AppleMusicService;
    private musicKit: any;
    private isInitialized: boolean = false;

    private constructor() {}

    static getInstance(): AppleMusicService {
        if (!AppleMusicService.instance) {
            AppleMusicService.instance = new AppleMusicService();
        }
        return AppleMusicService.instance;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Get token from Firebase function
            const functions = getFunctions();
            const getMusicKitToken = httpsCallable(functions, 'getMusicKitToken');
            const { data: { token } } = await getMusicKitToken();

            await this.configureMusicKit(token);
            this.musicKit = window.MusicKit.getInstance();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Apple Music:', error);
            throw error;
        }
    }

    private async configureMusicKit(developerToken: string): Promise<void> {
        await window.MusicKit.configure({
            developerToken,
            app: {
                name: 'Playlist Porter',
                build: '1.0.0'
            }
        });
    }

    async authorize(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        await this.musicKit.authorize();
    }

    async createPlaylist(name: string, description: string = ''): Promise<string> {
        if (!this.musicKit.isAuthorized) {
            await this.authorize();
        }

        const playlist = await this.musicKit.api.library.createPlaylist({
            name,
            description
        });

        return playlist.id;
    }

    async addTracksToPlaylist(playlistId: string, tracks: SpotifyTrack[]): Promise<void> {
        if (!this.musicKit.isAuthorized) {
            await this.authorize();
        }

        // Search and add tracks one by one
        for (const track of tracks) {
            try {
                // Search for the track on Apple Music
                const query = `${track.name} ${track.artists[0].name}`;
                const results = await this.musicKit.api.search(query, {
                    types: ['songs'],
                    limit: 1
                });

                if (results.songs.data.length > 0) {
                    const appleMusicTrack = results.songs.data[0];
                    await this.musicKit.api.library.addToPlaylist(playlistId, {
                        songs: [appleMusicTrack.id]
                    });
                }
            } catch (error) {
                console.error(`Failed to add track: ${track.name}`, error);
            }
        }
    }
}