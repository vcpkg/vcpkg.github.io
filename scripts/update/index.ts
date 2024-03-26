import * as path from 'path';
import fs from 'fs-extra';
import { exit } from 'process';
import { addVersions } from './tasks/add-versions.js';
import { readPackages } from './tasks/read-packages.js';
import { addStars } from './tasks/add-stars.js';
import { addStatus } from './tasks/add-status.js';
import { Manifest } from './types';
import { readTriplets } from './tasks/read-triplets.js';

if (!process.argv[2]) {
  console.error('missing path to vcpkg repository');
  exit(-1);
}

const sourcePath = process.argv[2];
const portsPath = path.join(sourcePath, 'ports');
const versionsPath = path.join(sourcePath, 'versions');
const baselinePath = path.join(sourcePath, 'scripts', 'ci.baseline.txt');
const tripletsPath = path.join(sourcePath, 'triplets');

const triplets = await readTriplets(tripletsPath);

const manifests = await readPackages(portsPath);
const manifestsWithVersions = await addVersions(versionsPath, manifests);
const manifestsWithVersionsAndStatus = await addStatus(
  baselinePath,
  triplets,
  manifestsWithVersions,
);

let manifestsWithVersionsAndStatusAndStars: Manifest[] | undefined = undefined;
if (process.argv[3]) {
  manifestsWithVersionsAndStatusAndStars = await addStars(
    manifestsWithVersionsAndStatus,
    process.argv[3],
  );
} else {
  console.warn('Missing GitHub token. Skipping fetching stars');
}

await fs.writeJson(
  'output.json',
  manifestsWithVersionsAndStatusAndStars ?? manifestsWithVersionsAndStatus,
  { spaces: 2 },
);
