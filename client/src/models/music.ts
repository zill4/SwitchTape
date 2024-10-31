export interface Artist {
    id: string;
    name: string;
    uri?: string;
}

export interface Album {
    id: string;
    name: string;
    images: Image[];
    releaseDate?: string;
    artists: Artist[];
}

export interface Track {
    id: string;
    name: string;
    durationMs: number;
    previewUrl?: string;
    artists: Artist[];
    album: Album;
    uri?: string;
}

export interface Image {
    url: string;
    width?: number;
    height?: number;
}

export interface Playlist {
    id: string;
    name: string;
    description?: string;
    images: Image[];
    tracks: Track[];
    uri?: string;
    totalTracks: number;
}