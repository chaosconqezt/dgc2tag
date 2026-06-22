import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export interface TagDefaults {
    artist: boolean;
    albumArtist: boolean;
    album: boolean;
    year: boolean;
    genre: boolean;
    country: boolean;
    label: boolean;
    releaseType: boolean;
}

export interface Config {
    musicRoot: string;
    port: number;
    tagDefaults: TagDefaults;
    writeTrackNames: boolean;
    writeTrackArtists: boolean;
    outputFolder: string;
    outputMode: 'subfolder' | 'absolute';
}

const CONFIG_PATH = path.join(__dirname, '../config.json');
const DEFAULT_TAG_DEFAULTS: TagDefaults = {
    artist: true, albumArtist: true, album: true, year: true,
    genre: true, country: true, label: true, releaseType: true,
};

export async function loadConfig(): Promise<Config> {
    try {
        const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
            musicRoot: parsed.musicRoot || DEFAULTS.musicRoot,
            port: typeof parsed.port === 'number' ? parsed.port : DEFAULTS.port,
            tagDefaults: { ...DEFAULT_TAG_DEFAULTS, ...(parsed.tagDefaults || {}) },
            writeTrackNames: typeof parsed.writeTrackNames === 'boolean' ? parsed.writeTrackNames : DEFAULTS.writeTrackNames,
            writeTrackArtists: typeof parsed.writeTrackArtists === 'boolean' ? parsed.writeTrackArtists : DEFAULTS.writeTrackArtists,
            outputFolder: typeof parsed.outputFolder === 'string' ? parsed.outputFolder : DEFAULTS.outputFolder,
            outputMode: parsed.outputMode === 'absolute' ? 'absolute' : 'subfolder',
        };
    } catch {
        return { ...DEFAULTS };
    }
}

export async function saveConfig(config: Config): Promise<void> {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

const DEFAULTS: Config = {
    musicRoot: process.env.MUSIC_ROOT || 'c:\\vibecode\\dgc2tag\\test_muz',
    port: parseInt(process.env.SERVER_PORT || '3001', 10),
    tagDefaults: DEFAULT_TAG_DEFAULTS,
    writeTrackNames: true,
    writeTrackArtists: false,
    outputFolder: 'dgc',
    outputMode: 'subfolder',
};
