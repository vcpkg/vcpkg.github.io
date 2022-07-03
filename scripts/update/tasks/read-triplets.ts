import { Triplets } from '../types';
import fs from 'fs-extra';
import path from 'path';

export async function readTriplets(tripletsPath: string): Promise<Triplets> {
  return {
    'built-in': await findTriplets(tripletsPath),
    community: await findTriplets(path.join(tripletsPath, 'community')),
  };
}

async function findTriplets(directory: string): Promise<string[]> {
  const triplets: string[] = [];
  (await fs.readdir(directory)).forEach((file) => {
    if (file.endsWith('.cmake')) {
      triplets.push(file.slice(0, -6));
    }
  });
  return triplets;
}
