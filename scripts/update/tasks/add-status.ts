import { ManifestWithVersions, ManifestWithVersionsAndStatus, Status, Triplets } from '../types';
import { parseBaseline } from '../parsers/baseline-parser.js';
import { allTargets } from '../parsers/status-parser.js';

export async function addStatus(
  baselinePath: string,
  triplets: Triplets,
  manifests: ManifestWithVersions[],
): Promise<ManifestWithVersionsAndStatus[]> {
  const result: ManifestWithVersionsAndStatus[] = [];
  const packageStatus = await parseBaseline(baselinePath);

  for (const manifest of manifests) {
    const status: Partial<Status> = {};
    if ('supports' in manifest) {
      for (const triplet of triplets['built-in']) {
        const targets = allTargets(triplets, false);
        for (const target of triplet.split('-')) {
          targets[target] = true;
        }
        const ebnfExpression = manifest['supports']
          ?.replaceAll('&', '&&')
          .replaceAll('|', '||')
          .replaceAll(/(\w+)/g, (match, p1) => {
            return `targets.${p1}`;
          });
        const res: boolean = eval(ebnfExpression!);
        status[triplet as keyof Status] = res ? 'pass' : 'fail';
      }
    } else {
      for (const triplet of triplets['built-in']) {
        if (packageStatus[manifest.name]?.[triplet as keyof Status]) {
          status[triplet as keyof Status] = packageStatus[manifest.name][triplet as keyof Status];
        } else {
          status[triplet as keyof Status] = 'pass';
        }
      }
    }
    result.push({ ...manifest, status } as ManifestWithVersionsAndStatus);
  }

  return result;
}
