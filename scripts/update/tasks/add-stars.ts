import { Octokit } from 'octokit';
import { parseStars } from '../parsers/stars-parser.js';
import { ManifestWithVersions, ManifestWithVersionsAndStars } from '../types';

const gitHubRegex = new RegExp('github.com/(?<owner>[-_.a-zA-Z0-9]+)/(?<repo>[-_.a-zA-Z0-9]+)');

export async function addStars(
  manifests: ManifestWithVersions[],
  gitHubToken: string,
): Promise<ManifestWithVersionsAndStars[]> {
  const octokit = new Octokit({ auth: gitHubToken });
  const result: ManifestWithVersionsAndStars[] = [];
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
