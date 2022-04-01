import path from 'path';
import { parseVersions } from '../parsers/version-parser.js';
import type { Manifest, ManifestWithVersions } from '../types';

export async function addVersions(
  rootPath: string,
  manifests: Manifest[],
): Promise<ManifestWithVersions[]> {
  const result: ManifestWithVersions[] = [];
  for (const manifest of manifests) {
    const versionsPath = path.join(rootPath, `${manifest.name[0]}-`, `${manifest.name}.json`);
    result.push({ ...manifest, ...(await parseVersions(versionsPath)) });
  }
  return result;
}
