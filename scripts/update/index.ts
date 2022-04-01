import * as path from 'path';
import fs from 'fs-extra';
import { exit } from 'process';
import { addVersions } from './tasks/add-versions.js';
import { readPackages } from './tasks/read-packages.js';
import { addStars } from './tasks/add-stars.js';
import { ManifestWithVersionsAndStars } from './types.js';

if (!process.argv[2]) {
  console.error('missing path to vcpkg repository');
  exit(-1);
}

const sourcePath = process.argv[2];
const portsPath = path.join(sourcePath, 'ports');
const versionsPath = path.join(sourcePath, 'versions');

const manifests = await readPackages(portsPath);
const manifestsWithVersions = await addVersions(versionsPath, manifests);

let manifestsWithStars: ManifestWithVersionsAndStars[] | undefined = undefined;
if (process.argv[3]) {
  manifestsWithStars = await addStars(manifestsWithVersions, process.argv[3]);
} else {
  console.warn('Missing GitHub token. Skipping fetching stars');
}

fs.writeJson('output.json', manifestsWithStars ?? manifestsWithVersions, { spaces: 2 });
