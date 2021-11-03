import * as path from 'path';
import fs from 'fs-extra';
import { exit } from 'process';
import { addVersions } from './tasks/add-versions.js';
import { readPackages } from './tasks/read-packages.js';

if (!process.argv[2]) {
  exit(-1);
}

const sourcePath = process.argv[2];
const portsPath = path.join(sourcePath, 'ports');
const versionsPath = path.join(sourcePath, 'versions');

const manifests = await readPackages(portsPath);
const manifests2 = await addVersions(versionsPath, manifests);

fs.writeJson('output.json', manifests2, { spaces: 2 });
