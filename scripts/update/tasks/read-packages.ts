import { fdir, PathsOutput } from 'fdir';
import { parseManifest } from '../parsers/manifest-parser.js';
import type { Manifest } from '../types';

export async function readPackages(rootDir: string): Promise<Manifest[]> {
  let packages: Manifest[] = [];

  const vcpkgFiles = (await new fdir()
    .glob('./**/vcpkg.json')
    .withFullPaths()
    .crawl(rootDir)
    .withPromise()) as PathsOutput;

  for (const vcpkgFile of vcpkgFiles) {
    packages.push(await parseManifest(vcpkgFile));
  }

  return packages;
}
