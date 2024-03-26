import fs from 'fs-extra';
import type { Versions } from '../types';

export async function parseVersions(path: string): Promise<Versions> {
  return fs.readJson(path, { encoding: 'utf-8' });
}
