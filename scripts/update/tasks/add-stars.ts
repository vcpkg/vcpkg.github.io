import { Octokit } from 'octokit';
import { parseStars } from '../parsers/stars-parser.js';
import { ManifestWithVersionsAndStatus, ManifestWithVersionsAndStatusAndStars } from '../types';

const gitHubRegex = new RegExp('github.com/(?<owner>[-_.a-zA-Z\\d]+)/(?<repo>[-_.a-zA-Z\\d]+)');

export async function addStars(
  manifests: ManifestWithVersionsAndStatus[],
  gitHubToken: string,
): Promise<ManifestWithVersionsAndStatusAndStars[]> {
  const octokit = new Octokit({ auth: gitHubToken });
  const result: ManifestWithVersionsAndStatusAndStars[] = [];
  for (const manifest of manifests) {
    if (manifest.homepage !== undefined && gitHubRegex.test(manifest.homepage)) {
      const [_, owner, repo] = gitHubRegex.exec(manifest.homepage) ?? [];
      result.push({ ...manifest, ...(await parseStars(octokit, owner, repo)) });
    } else {
      result.push(manifest);
    }
  }
  return result;
}
