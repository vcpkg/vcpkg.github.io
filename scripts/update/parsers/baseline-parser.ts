import fs from 'fs-extra';
import { Status } from '../types';

const baselineRegex = new RegExp(
  '^\\s*(?<name>[\\w-]+)\\s*:\\s*(?<triplet>[\\w-]+)\\s*=\\s*(?<status>\\w+)\\s*$',
  'gm',
);

export async function parseBaseline(path: string): Promise<Record<string, Partial<Status>>> {
  const baseline = await fs.readFile(path, { encoding: 'utf-8' });
  let packageStatus: Record<string, Partial<Status>> = {};
  for (const [_, name, triplet, status] of baseline.matchAll(baselineRegex)) {
    if (packageStatus[name] !== undefined) {
      packageStatus[name] = { ...packageStatus[name], ...{ [triplet]: status } };
    } else {
      packageStatus[name] = { [triplet]: status };
    }
  }
  return packageStatus;
}
