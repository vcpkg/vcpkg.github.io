import fs from 'fs-extra';
import type { Manifest } from '../types';

export async function parseManifest(path: string): Promise<Manifest> {
  return fs.readJson(path, { encoding: 'utf-8' });
}
