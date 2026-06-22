import { mkdir, readdir, unlink } from 'fs/promises';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd(), '..');
const CACHE_DIR = join(PROJECT_ROOT, 'cache');
const BANDS_DIR = join(CACHE_DIR, 'bands');
const RELEASES_DIR = join(CACHE_DIR, 'releases');

async function ensureDir(dir: string) {
    await mkdir(dir, { recursive: true });
}



export async function clearCache(subdir?: 'bands' | 'releases'): Promise<number> {
    const dirsToClear = subdir
        ? [subdir === 'bands' ? BANDS_DIR : RELEASES_DIR]
        : [BANDS_DIR, RELEASES_DIR];

    let cleared = 0;
    for (const dir of dirsToClear) {
        try {
            await ensureDir(dir);
            const files = await readdir(dir);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                await unlink(join(dir, file));
                cleared++;
            }
        } catch {
            // ignore
        }
    }
    return cleared;
}