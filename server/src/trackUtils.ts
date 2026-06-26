import NodeID3 from 'node-id3';
import fs from 'fs/promises';
import path from 'path';
import type { Id3Tags } from './types.js';

export function isInsideMusicRoot(targetPath: string, musicRoot: string): boolean {
    const resolved = path.resolve(targetPath).toLowerCase();
    const root = path.resolve(musicRoot).toLowerCase();
    return resolved === root || resolved.startsWith(root + path.sep.toLowerCase());
}

export function assertInsideMusicRoot(targetPath: string, musicRoot: string): void {
    if (!isInsideMusicRoot(targetPath, musicRoot)) {
        throw new Error('Access denied: path is outside music root');
    }
}

export async function getMp3Files(dir: string): Promise<string[]> {
    const files = await fs.readdir(dir);
    return files.filter(f => f.toLowerCase().endsWith('.mp3'));
}

export function extractTrackNumber(file: string, tags?: Id3Tags | Record<string, unknown>): string | undefined {
    const t = tags || {};

    if (t.track) {
        const raw = String(t.track);
        const numStr = raw.includes('/') ? raw.split('/')[0]! : raw;
        const match = numStr.match(/^(\d+)/);
        if (match) return match[1];
    }
    if (t.trackNumber) {
        const raw = String(t.trackNumber);
        const numStr = raw.includes('/') ? raw.split('/')[0]! : raw;
        if (/^\d+$/.test(numStr)) return numStr;
    }
    const numMatch = file.match(/^(\d{1,3})/);
    return numMatch?.[1];
}