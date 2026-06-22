import fs from 'fs/promises';
import { readdirSync } from 'fs';
import path from 'path';

// Local Dirent interface to avoid fs/promises type incompatibility
interface DirentLike {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
    isSymbolicLink(): boolean;
}

export interface FileNode {
    name: string;
    path: string;
    type: 'directory' | 'file';
    children?: FileNode[];
    hasAudioFiles?: boolean; // true if this directory contains audio files (directly or recursively)
}

const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.m4a', '.ogg', '.wav', '.wma', '.aac']);

function isAudioFile(name: string): boolean {
    return AUDIO_EXTENSIONS.has(path.extname(name).toLowerCase());
}

const DEFAULT_MAX_DEPTH = 20;

export async function getLibraryTree(rootPath: string, maxDepth = DEFAULT_MAX_DEPTH): Promise<FileNode[]> {
    const visited = new Set<string>();
    const root = await buildDirectory(rootPath, visited, maxDepth);
    // Return children of the root (musicRoot itself is not shown)
    return root.children || [];
}

async function buildDirectory(
    dirPath: string,
    visited: Set<string>,
    maxDepth: number,
    currentDepth = 0,
): Promise<FileNode> {
    // Protection: depth limit
    if (currentDepth >= maxDepth) {
        return {
            name: path.basename(dirPath),
            path: dirPath,
            type: 'directory',
            hasAudioFiles: false,
        };
    }

    // Protection: resolve real path to detect symlinks / cycles
    let resolved: string;
    try {
        resolved = await fs.realpath(dirPath);
    } catch {
        return { name: path.basename(dirPath), path: dirPath, type: 'directory', hasAudioFiles: false };
    }

    if (visited.has(resolved)) {
        // Cycle detected — skip this directory
        return { name: path.basename(dirPath), path: dirPath, type: 'directory', hasAudioFiles: false };
    }
    visited.add(resolved);

    let entries: DirentLike[];
    try {
        entries = readdirSync(dirPath, { withFileTypes: true }) as unknown as DirentLike[];
    } catch {
        return { name: path.basename(dirPath), path: dirPath, type: 'directory', hasAudioFiles: false };
    }

    const children: FileNode[] = [];
    let hasAudioFiles = false;

    for (const entry of entries) {
        // Skip symlinks entirely to prevent infinite loops
        if (entry.isSymbolicLink()) continue;

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            const childDir = await buildDirectory(fullPath, visited, maxDepth, currentDepth + 1);
            children.push(childDir);
            if (childDir.hasAudioFiles) {
                hasAudioFiles = true;
            }
        } else if (entry.isFile() && isAudioFile(entry.name)) {
            children.push({
                name: entry.name,
                path: fullPath,
                type: 'file',
            });
            hasAudioFiles = true;
        }
    }

    const sorted = children.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    return {
        name: path.basename(dirPath),
        path: dirPath,
        type: 'directory',
        children: sorted,
        hasAudioFiles,
    };
}

export async function getDirectoryChildren(dirPath: string): Promise<FileNode[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    const nodes: FileNode[] = [];
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            nodes.push({
                name: entry.name,
                path: fullPath,
                type: 'directory',
            });
        } else if (entry.isFile() && isAudioFile(entry.name)) {
            nodes.push({
                name: entry.name,
                path: fullPath,
                type: 'file'
            });
        }
    }
    
    return nodes.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
}
