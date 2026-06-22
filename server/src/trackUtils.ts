import NodeID3 from 'node-id3';
import path from 'path';

interface Id3Tags {
    track?: number;
    trackNumber?: string | number;
    [key: string]: unknown;
}

/**
 * Извлекает track номер из файла (ReadID3 тег или из имени файла)
 * Возвращает отстутствующий trackNum -> undefined
 */
export function extractTrackNumber(file: string, tags?: any): string | undefined {
    let trackNum: string | undefined;

    // Если теги предоставлены, использовать их
    const t = tags || {};

    if (t.track) {
        const match = String(t.track).match(/^(\d+)/);
        if (match) trackNum = match[1];
    }
    if (!trackNum && t.trackNumber) {
        trackNum = String(t.trackNumber);
    }
    // Если тегов нет, они должны вычитаться из имени файла
    if (!trackNum) {
        const numMatch = file.match(/^(\d{1,3})/);
        trackNum = numMatch?.[1];
    }
    return trackNum;
}

export function getTrackNumberWithId3(filePath: string): string | undefined {
    try {
        const tags = NodeID3.read(filePath) as unknown as Id3Tags;
        return extractTrackNumber(path.basename(filePath), tags);
    } catch {
        return undefined;
    }
}