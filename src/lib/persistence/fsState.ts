import { promises as fs } from 'fs';
import { dirname, join } from 'path';

export const dataRoot = process.env.DATA_DIR || './data/state';

async function ensureDir(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export async function readJson<T>(relPath: string, fallback: T): Promise<T> {
  const full = join(dataRoot, relPath);
  try {
    const buf = await fs.readFile(full, 'utf8');
    return JSON.parse(buf) as T;
  } catch (e: any) {
    return fallback;
  }
}

export async function writeJson<T>(relPath: string, data: T): Promise<void> {
  const full = join(dataRoot, relPath);
  await ensureDir(dirname(full));
  const tmp = `${full}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, full);
}

