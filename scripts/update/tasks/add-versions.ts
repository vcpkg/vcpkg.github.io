import path from 'path';
import { parseVersions } from '../parsers/version-parser.js';
import type { Manifest, Versions } from '../types';

export async function addVersions(
  rootPath: string,
  manifests: Manifest[],
): Promise<(Manifest & Versions)[]> {
  let result: (Manifest & Versions)[] = [];
  for (const manifest of manifests) {
    const versionsPath = path.join(
      rootPath,
      `${manifest.name[0]}-`,
      `${manifest.name}.json`,
    );
    result.push({ ...manifest, ...(await parseVersions(versionsPath)) });
  }
  return result;
}
